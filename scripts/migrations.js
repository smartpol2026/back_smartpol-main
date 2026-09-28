#!/usr/bin/env node
require('dotenv/config');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const TRACKING_TABLE = 'sql_migrations';

function usage() {
  console.log(`
Usage:
  pnpm run migration:run
  pnpm run migration:run -- <file.sql>
  pnpm run migration:status
  pnpm run migration:create -- <migration-name>
`);
}

function getSqlFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

function checksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function getClient() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'postgres',
  });
  await client.connect();
  return client;
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMap(client) {
  const result = await client.query(
    `SELECT filename, checksum, applied_at FROM ${TRACKING_TABLE} ORDER BY filename ASC`,
  );

  const map = new Map();
  result.rows.forEach((row) => {
    map.set(row.filename, row);
  });
  return map;
}

async function showStatus() {
  const client = await getClient();
  try {
    await ensureTrackingTable(client);

    const sqlFiles = getSqlFiles();
    const appliedMap = await getAppliedMap(client);

    const applied = [];
    const pending = [];
    const changed = [];

    for (const file of sqlFiles) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const sum = checksum(content);
      const appliedRow = appliedMap.get(file);

      if (!appliedRow) {
        pending.push(file);
      } else if (appliedRow.checksum !== sum) {
        changed.push(file);
      } else {
        applied.push(file);
      }
    }

    console.log(`Migrations directory: ${MIGRATIONS_DIR}`);
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending: ${pending.length}`);
    console.log(`Changed after apply: ${changed.length}`);

    if (pending.length) {
      console.log('\nPending migrations:');
      pending.forEach((file) => console.log(`  - ${file}`));
    }

    if (changed.length) {
      console.log('\nWarning: changed migrations (checksum mismatch):');
      changed.forEach((file) => console.log(`  - ${file}`));
    }
  } finally {
    await client.end();
  }
}

async function runMigrations(targetFile) {
  const client = await getClient();
  try {
    await ensureTrackingTable(client);

    const sqlFiles = getSqlFiles();
    if (!sqlFiles.length) {
      console.log('No SQL migration files found.');
      return;
    }

    const appliedMap = await getAppliedMap(client);
    let candidates = sqlFiles.filter((file) => !appliedMap.has(file));

    if (targetFile) {
      const exists = sqlFiles.includes(targetFile);
      if (!exists) {
        throw new Error(`Migration file not found: ${targetFile}`);
      }
      candidates = candidates.filter((file) => file === targetFile);
    }

    if (!candidates.length) {
      console.log('No pending migrations to apply.');
      return;
    }

    for (const file of candidates) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const sum = checksum(sql);

      console.log(`Applying: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${TRACKING_TABLE} (filename, checksum) VALUES ($1, $2)`,
          [file, sum],
        );
        await client.query('COMMIT');
        console.log(`✓ Applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Failed migration ${file}: ${error.message}`);
      }
    }

    console.log('\nAll requested migrations were applied successfully.');
  } finally {
    await client.end();
  }
}

function createMigration(name) {
  if (!name) {
    throw new Error('You must provide a migration name.');
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new Error('Invalid migration name.');
  }

  const fileName = `${Date.now()}-${normalized}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  const template = `-- Migration: ${name}\n-- Created at: ${new Date().toISOString()}\n\nBEGIN;\n\n-- Write SQL here\n\nCOMMIT;\n`;

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(`Created migration: migrations/${fileName}`);
}

async function main() {
  const command = process.argv[2];
  const rawArgs = process.argv.slice(3).filter((arg) => arg !== '--');

  try {
    if (!command || command === '--help' || command === '-h') {
      usage();
      return;
    }

    if (command === 'status') {
      await showStatus();
      return;
    }

    if (command === 'run') {
      const targetFile = rawArgs[0];
      await runMigrations(targetFile);
      return;
    }

    if (command === 'create') {
      const name = rawArgs.join(' ');
      createMigration(name);
      return;
    }

    usage();
    process.exitCode = 1;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
