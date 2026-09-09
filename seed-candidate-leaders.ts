import { DataSource } from 'typeorm';
import { Leader } from './src/database/entities/leader.entity';
import { Candidate } from './src/database/entities/candidate.entity';

const candidateLeaderData = [
  { leaderId: 1, candidateId: 6 },
  { leaderId: 1, candidateId: 7 },
  { leaderId: 1, candidateId: 3 },
  { leaderId: 2, candidateId: 6 },
  { leaderId: 2, candidateId: 7 },
  { leaderId: 2, candidateId: 3 },
  { leaderId: 3, candidateId: 6 },
  { leaderId: 3, candidateId: 7 },
  { leaderId: 3, candidateId: 3 },
  { leaderId: 4, candidateId: 6 },
  { leaderId: 4, candidateId: 7 },
  { leaderId: 4, candidateId: 3 },
  { leaderId: 5, candidateId: 6 },
  { leaderId: 5, candidateId: 7 },
  { leaderId: 5, candidateId: 3 },
  { leaderId: 6, candidateId: 6 },
  { leaderId: 6, candidateId: 7 },
  { leaderId: 6, candidateId: 3 },
  { leaderId: 7, candidateId: 6 },
  { leaderId: 7, candidateId: 7 },
  { leaderId: 7, candidateId: 1 },
  { leaderId: 8, candidateId: 6 },
  { leaderId: 8, candidateId: 7 },
  { leaderId: 8, candidateId: 1 },
  { leaderId: 9, candidateId: 6 },
  { leaderId: 9, candidateId: 7 },
  { leaderId: 9, candidateId: 1 },
  { leaderId: 10, candidateId: 6 },
  { leaderId: 10, candidateId: 7 },
  { leaderId: 10, candidateId: 4 },
  { leaderId: 11, candidateId: 6 },
  { leaderId: 11, candidateId: 7 },
  { leaderId: 11, candidateId: 4 },
  { leaderId: 12, candidateId: 6 },
  { leaderId: 12, candidateId: 7 },
  { leaderId: 12, candidateId: 1 },
  { leaderId: 13, candidateId: 6 },
  { leaderId: 13, candidateId: 7 },
  { leaderId: 13, candidateId: 4 },
  { leaderId: 14, candidateId: 6 },
  { leaderId: 14, candidateId: 7 },
  { leaderId: 14, candidateId: 2 },
  { leaderId: 15, candidateId: 6 },
  { leaderId: 15, candidateId: 7 },
  { leaderId: 15, candidateId: 2 },
  { leaderId: 16, candidateId: 6 },
  { leaderId: 16, candidateId: 7 },
  { leaderId: 16, candidateId: 4 },
  { leaderId: 17, candidateId: 6 },
  { leaderId: 17, candidateId: 7 },
  { leaderId: 17, candidateId: 4 },
  { leaderId: 18, candidateId: 6 },
  { leaderId: 18, candidateId: 7 },
  { leaderId: 18, candidateId: 3 },
  { leaderId: 19, candidateId: 6 },
  { leaderId: 19, candidateId: 7 },
  { leaderId: 19, candidateId: 4 },
  { leaderId: 20, candidateId: 6 },
  { leaderId: 20, candidateId: 7 },
  { leaderId: 20, candidateId: 4 },
  { leaderId: 21, candidateId: 6 },
  { leaderId: 21, candidateId: 7 },
  { leaderId: 21, candidateId: 3 },
  { leaderId: 22, candidateId: 6 },
  { leaderId: 22, candidateId: 7 },
  { leaderId: 22, candidateId: 1 },
  { leaderId: 23, candidateId: 6 },
  { leaderId: 23, candidateId: 7 },
  { leaderId: 23, candidateId: 1 },
  { leaderId: 24, candidateId: 6 },
  { leaderId: 24, candidateId: 7 },
  { leaderId: 24, candidateId: 1 },
  { leaderId: 25, candidateId: 7 },
  { leaderId: 26, candidateId: 7 },
  { leaderId: 26, candidateId: 4 },
  { leaderId: 27, candidateId: 7 },
  { leaderId: 28, candidateId: 7 },
  { leaderId: 28, candidateId: 3 },
  { leaderId: 29, candidateId: 7 },
  { leaderId: 29, candidateId: 3 },
  { leaderId: 30, candidateId: 6 },
  { leaderId: 30, candidateId: 7 },
  { leaderId: 30, candidateId: 1 },
  { leaderId: 31, candidateId: 6 },
  { leaderId: 31, candidateId: 7 },
  { leaderId: 31, candidateId: 1 },
  { leaderId: 32, candidateId: 6 },
  { leaderId: 32, candidateId: 7 },
  { leaderId: 32, candidateId: 1 },
  { leaderId: 33, candidateId: 6 },
  { leaderId: 33, candidateId: 7 },
  { leaderId: 33, candidateId: 1 },
  { leaderId: 34, candidateId: 6 },
  { leaderId: 34, candidateId: 7 },
  { leaderId: 34, candidateId: 1 },
];

async function seedCandidateLeaders() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5236'),
    username: process.env.DB_USERNAME || 'temp-smartpol_user',
    password: process.env.DB_PASSWORD || 'temp-smartpol_password',
    database: process.env.DB_DATABASE || 'temp-smartpol_db',
    entities: ['src/database/entities/*.entity.ts'],
    synchronize: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const candidateRepository = AppDataSource.getRepository(Candidate);
    const leaderRepository = AppDataSource.getRepository(Leader);

    let successCount = 0;
    let skipCount = 0;

    for (const relation of candidateLeaderData) {
      const candidate = await candidateRepository.findOne({
        where: { id: relation.candidateId },
        relations: ['leaders'],
      });

      const leader = await leaderRepository.findOne({
        where: { id: relation.leaderId },
      });

      if (!candidate) {
        console.log(`⚠ Candidate with ID ${relation.candidateId} not found. Skipping...`);
        skipCount++;
        continue;
      }

      if (!leader) {
        console.log(`⚠ Leader with ID ${relation.leaderId} not found. Skipping...`);
        skipCount++;
        continue;
      }

      // Check if the relationship already exists
      const relationExists = candidate.leaders.some((l) => l.id === relation.leaderId);

      if (relationExists) {
        console.log(
          `⚠ Leader ${relation.leaderId} already assigned to Candidate ${relation.candidateId}. Skipping...`
        );
        skipCount++;
      } else {
        candidate.leaders.push(leader);
        await candidateRepository.save(candidate);
        console.log(`✓ Assigned Leader ${relation.leaderId} to Candidate ${relation.candidateId}`);
        successCount++;
      }
    }

    console.log(`\n✅ Seed completed!`);
    console.log(`   • Successfully assigned: ${successCount}`);
    console.log(`   • Skipped: ${skipCount}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedCandidateLeaders();
