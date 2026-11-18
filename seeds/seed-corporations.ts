import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Corporation } from '../src/database/entities/corporation.entity';

const corporations = [
  'Gobernación',
  'Alcaldía',
  'Concejo Municipal',
  'Presidencia',
  'Asamblea',
  'Edil / JAL',
];

async function seedCorporations() {
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

    const corporationRepository = AppDataSource.getRepository(Corporation);

    for (const name of corporations) {
      const existing = await corporationRepository.findOne({ where: { name } });

      if (existing) {
        console.log(`Corporation "${name}" already exists.`);
        continue;
      }

      const corporation = corporationRepository.create({ name });
      await corporationRepository.save(corporation);
      console.log(`Created corporation: ${name}`);
    }

    console.log('\n Corporations seed completed successfully');
  } catch (error) {
    console.error('Error during corporations seeding:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedCorporations();
