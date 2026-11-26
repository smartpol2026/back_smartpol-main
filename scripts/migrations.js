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
  pnpm run migration:lint [-- <file.sql>]
  pnpm run migration:create -- <migration-name>
`);
}

// Orden de ejecución explícito en migrations/order.txt (NO alfabético).
const ORDER_FILE = path.join(MIGRATIONS_DIR, 'order.txt');

// Cada línea: "archivo.sql" o "archivo.sql !legacy".
// !legacy = migración original anterior al runner, ya aplicada en producción.
// El runner la REGISTRA en sql_migrations sin ejecutarla (no se modifica el archivo).
function readOrderEntries() {
  if (!fs.existsSync(ORDER_FILE)) {
    throw new Error('Falta migrations/order.txt (orden de ejecución de las migraciones).');
  }
  return fs
    .readFileSync(ORDER_FILE, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split(/\s+/);
      return { name: parts[0], legacy: parts.slice(1).includes('!legacy') };
    });
}

function readOrderManifest() {
  return readOrderEntries().map((entry) => entry.name);
}

function getLegacySet() {
  return new Set(readOrderEntries().filter((e) => e.legacy).map((e) => e.name));
}

function getSqlFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const onDisk = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.sql'));
  const ordered = readOrderManifest();

  const problems = [];
  const dupes = [...new Set(ordered.filter((f, i) => ordered.indexOf(f) !== i))];
  const missing = ordered.filter((f) => !onDisk.includes(f));
  const notListed = onDisk.filter((f) => !ordered.includes(f));
  if (dupes.length) problems.push(`Repetidos en order.txt: ${dupes.join(', ')}`);
  if (missing.length) problems.push(`En order.txt pero no existen: ${missing.join(', ')}`);
  if (notListed.length) problems.push(`Existen pero no están en order.txt: ${notListed.join(', ')}`);
  if (problems.length) {
    throw new Error(problems.join('\n'));
  }

  return ordered;
}

// Detecta tablas usadas por un archivo antes de que otro archivo anterior las cree
// (por ejemplo, ALTER TABLE table_reports antes de CREATE TABLE table_reports).
function sqlTableRefs(raw) {
  // Solo quitamos comentarios y cadenas. NO quitamos bloques $$ (DO ...), porque
  // contienen DDL real (por ejemplo, FOREIGN KEY ... REFERENCES roles).
  const clean = raw
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ');
  const creates = new Set(
    [...clean.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?"?([a-z_]+)"?/gi)].map((m) =>
      m[1].toLowerCase(),
    ),
  );
  const uses = new Set();
  const usageRe =
    /\b(?:ALTER TABLE|INSERT INTO|UPDATE|DELETE FROM|REFERENCES|FROM|JOIN|CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?\S+ ON)\s+(?:ONLY\s+)?(?:public\.)?"?([a-z_]+)"?/gi;
  for (const m of clean.matchAll(usageRe)) uses.add(m[1].toLowerCase());
  for (const c of creates) uses.delete(c);
  return { creates, uses };
}

function checkDependencyOrder(files) {
  const info = files.map((file) => ({
    file,
    ...sqlTableRefs(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')),
  }));
  const creator = {};
  info.forEach((x, i) => {
    for (const t of x.creates) if (!(t in creator)) creator[t] = i;
  });
  const problems = [];
  info.forEach((x, i) => {
    for (const t of x.uses) {
      if (t in creator && creator[t] > i) {
        problems.push(
          `${x.file} usa la tabla "${t}" que se crea en ${info[creator[t]].file} (que está después en order.txt)`,
        );
      }
    }
  });
  return problems;
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
    const legacyPending = [];
    const changed = [];
    const legacy = getLegacySet();

    for (const file of sqlFiles) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const sum = checksum(content);
      const appliedRow = appliedMap.get(file);

      if (!appliedRow) {
        (legacy.has(file) ? legacyPending : pending).push(file);
      } else if (appliedRow.checksum !== sum) {
        changed.push(file);
      } else {
        applied.push(file);
      }
    }

    console.log(`Migrations directory: ${MIGRATIONS_DIR}`);
    console.log(`Applied: ${applied.length}`);
    console.log(`Pending (will be executed): ${pending.length}`);
    console.log(`Legacy (will be recorded WITHOUT executing): ${legacyPending.length}`);
    console.log(`Changed after apply: ${changed.length}`);

    if (pending.length) {
      console.log('\nPending migrations (migration:run will EXECUTE these):');
      pending.forEach((file) => console.log(`  - ${file}`));
    }

    if (legacyPending.length) {
      console.log('\nLegacy migrations (migration:run only records them, no SQL is run):');
      legacyPending.forEach((file) => console.log(`  - ${file}`));
    }

    if (changed.length) {
      console.log('\nWarning: changed migrations (checksum mismatch):');
      changed.forEach((file) => console.log(`  - ${file}`));
    }
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// Lint: detects migrations that are not safe to re-run (idempotency checks).
// Add the line `-- migration-lint: ignore` to a file to skip it on purpose.
// ---------------------------------------------------------------------------
const LINT_IGNORE_MARKER = /--\s*migration-lint:\s*ignore/i;

function stripSqlNoise(sql) {
  return sql
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, ' ') // dollar-quoted bodies (DO / functions)
    .replace(/'(?:[^']|'')*'/g, "''") // string literals
    .replace(/--[^\n]*/g, ' ') // line comments
    .replace(/\/\*[\s\S]*?\*\//g, ' '); // block comments
}

function lintMigration(file) {
  const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  if (LINT_IGNORE_MARKER.test(raw)) return [];

  const clean = stripSqlNoise(raw);
  const statements = clean
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const problems = [];

  for (const stmt of statements) {
    const head = stmt.slice(0, 80);

    if (/^CREATE (UNIQUE )?(TABLE|INDEX)\b(?! IF NOT EXISTS)/i.test(stmt)) {
      problems.push(`CREATE TABLE/INDEX sin IF NOT EXISTS: ${head}`);
    }
    if (/ADD COLUMN (?!IF NOT EXISTS)/i.test(stmt)) {
      problems.push(`ADD COLUMN sin IF NOT EXISTS: ${head}`);
    }
    if (
      /ADD CONSTRAINT/i.test(stmt) &&
      !/DROP CONSTRAINT IF EXISTS/i.test(stmt)
    ) {
      problems.push(
        `ADD CONSTRAINT sin DROP CONSTRAINT IF EXISTS previo (o bloque DO con IF NOT EXISTS): ${head}`,
      );
    }
    if (
      /DROP (TABLE|INDEX|COLUMN|CONSTRAINT|TRIGGER|FUNCTION|VIEW)\b(?! IF EXISTS)/i.test(
        stmt,
      )
    ) {
      problems.push(`DROP sin IF EXISTS: ${head}`);
    }
    if (/^DROP TABLE\b/i.test(stmt) || /^TRUNCATE\b/i.test(stmt)) {
      problems.push(
        `Operacion destructiva (DROP TABLE/TRUNCATE). Si es intencional agrega "-- migration-lint: ignore": ${head}`,
      );
    }
    if (/^(BEGIN|COMMIT|ROLLBACK|END)\b/i.test(stmt)) {
      problems.push(`BEGIN/COMMIT dentro de la migracion: el runner ya usa una transaccion; un COMMIT interno rompe la atomicidad: ${head}`);
    }
    if (/^ALTER SEQUENCE .* RESTART/i.test(stmt)) {
      problems.push(
        `ALTER SEQUENCE RESTART no es re-ejecutable; usa setval(MAX(id)): ${head}`,
      );
    }
    if (
      /^INSERT INTO\b/i.test(stmt) &&
      !/ON CONFLICT/i.test(stmt) &&
      !/WHERE NOT EXISTS/i.test(stmt)
    ) {
      problems.push(`INSERT sin ON CONFLICT / WHERE NOT EXISTS: ${head}`);
    }
    if (/^DELETE FROM\b/i.test(stmt) && !/\bWHERE\b/i.test(stmt)) {
      problems.push(`DELETE sin WHERE: ${head}`);
    }
    if (/^UPDATE\b/i.test(stmt) && !/\bWHERE\b/i.test(stmt)) {
      problems.push(`UPDATE sin WHERE (afecta todas las filas): ${head}`);
    }
    const trigger = stmt.match(/^CREATE (?:OR REPLACE )?TRIGGER\s+(\S+)/i);
    if (trigger) {
      const dropRe = new RegExp(
        `DROP TRIGGER IF EXISTS\\s+${trigger[1]}\\b`,
        'i',
      );
      if (!dropRe.test(clean)) {
        problems.push(
          `CREATE TRIGGER ${trigger[1]} sin DROP TRIGGER IF EXISTS previo`,
        );
      }
    }
  }

  return problems;
}

function lintFiles(files) {
  let total = 0;
  const legacy = getLegacySet();
  for (const file of files) {
    if (legacy.has(file)) continue; // originales anteriores al runner: no se ejecutan ni se revisan
    const problems = lintMigration(file);
    if (problems.length) {
      total += problems.length;
      console.error(`\n✗ ${file}`);
      problems.forEach((p) => console.error(`    - ${p}`));
    }
  }
  return total;
}

function runLint(targetFile) {
  const files = targetFile ? [targetFile] : getSqlFiles();
  const orderProblems = checkDependencyOrder(getSqlFiles());
  orderProblems.forEach((p) => console.error(`  orden: ${p}`));
  const total = lintFiles(files) + orderProblems.length;
  if (total) {
    console.error(`\nLint failed: ${total} problem(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Lint OK (${files.length} file(s)).`);
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

    // Migraciones !legacy: se registran como aplicadas SIN ejecutarlas.
    const legacy = getLegacySet();
    for (const file of sqlFiles) {
      if (legacy.has(file) && !appliedMap.has(file)) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await client.query(
          `INSERT INTO ${TRACKING_TABLE} (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING`,
          [file, checksum(sql)],
        );
        appliedMap.set(file, { filename: file });
        console.log(`Registrada sin ejecutar (legacy, ya aplicada antes del runner): ${file}`);
      }
    }

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

    // El orden de order.txt debe respetar las dependencias entre tablas.
    const orderProblems = checkDependencyOrder(getSqlFiles());
    if (orderProblems.length) {
      throw new Error(
        `Orden incorrecto en migrations/order.txt:\n  - ${orderProblems.join('\n  - ')}\nNothing was applied.`,
      );
    }

    // Refuse to touch the DB if any pending migration is not safe to re-run.
    const lintProblems = lintFiles(candidates);
    if (lintProblems) {
      throw new Error(
        `${lintProblems} lint problem(s) in pending migrations. Fix them (or add "-- migration-lint: ignore" if intentional). Nothing was applied.`,
      );
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
  const template =
    `-- Migration: ${name}\n-- Created at: ${new Date().toISOString()}\n--\n` +
    `-- Rules (checked by "migration:lint"):\n` +
    `--   * The runner already wraps this file in a transaction: do NOT add BEGIN/COMMIT.\n` +
    `--   * Must be safe to re-run: CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,\n` +
    `--     INSERT ... ON CONFLICT DO NOTHING, constraints inside DO blocks with IF NOT EXISTS.\n` +
    `--   * Never use ALTER SEQUENCE ... RESTART; use setval(..., MAX(id)).\n\n` +
    `-- Write SQL here\n`;

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

    if (command === 'lint') {
      runLint(rawArgs[0]);
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
