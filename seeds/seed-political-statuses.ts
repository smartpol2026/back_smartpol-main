import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PoliticalStatus } from '../src/database/entities/political-status.entity';

const politicalStatuses = [
  'Pendiente',
  'Comprometido - equipo',
  'Indeciso',
  'Contactado Comprometido',
  'Contactado no apoya',
];

async function seedPoliticalStatuses() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'temp-smartpol_user',
    password: process.env.DB_PASSWORD || 'temp-smartpol_password',
    database: process.env.DB_DATABASE || 'temp-smartpol_db',
    entities: ['src/database/entities/*.entity.ts'],
    synchronize: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const politicalStatusRepository =
      AppDataSource.getRepository(PoliticalStatus);

    for (const name of politicalStatuses) {
      const existing = await politicalStatusRepository.findOne({
        where: { name },
      });

      if (existing) {
        console.log(`Political status "${name}" already exists.`);
        continue;
      }

      const status = politicalStatusRepository.create({ name });
      await politicalStatusRepository.save(status);
      console.log(`Created political status: ${name}`);
    }

    console.log('\n Political statuses seed completed successfully');
  } catch (error) {
    console.error('Error during political statuses seeding:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedPoliticalStatuses();
