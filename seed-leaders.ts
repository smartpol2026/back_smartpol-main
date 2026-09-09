import { DataSource } from 'typeorm';
import { Leader } from './src/database/entities/leader.entity';

const leaderData = [
  { document: '1888116', name: 'HELMAR MENDOZA', phone: '3103814496', municipality: 'OVEJAS' },
  { document: '1101815743', name: 'RAMIRO TAPIA', phone: '3104185836', municipality: 'OVEJAS' },
  { document: '1101814600', name: 'FERNEY BENITEZ', phone: '3123175442', municipality: 'OVEJAS' },
  { document: '1101819246', name: 'JONATAN BETIN', phone: '3215501919', municipality: 'OVEJAS' },
  { document: '1888032', name: 'ELSON ARANATES ACOSTA RIVERO', phone: '3242186015', municipality: 'OVEJAS' },
  { document: '1888127', name: 'BERTONIS DE LA ROSA', phone: '3016510045', municipality: 'OVEJAS' },
  { document: '1888090', name: 'JOSE RAMIRO PULGAR ALVAREZ', phone: '3004603704', municipality: 'OVEJAS' },
  { document: '1102803329', name: 'GILBERTO CARLOS MANJARRES MEZA', phone: '3008111845', municipality: 'OVEJAS' },
  { document: '1888121', name: 'ISMAEL CARLOS SIERRA TORRES', phone: '3202979251', municipality: 'OVEJAS' },
  { document: '1102801828', name: 'NESTOR ENRIQUE GARCIA ARRIETA', phone: '3116739295', municipality: 'OVEJAS' },
  { document: '1887727', name: 'ALVARO ENRIQUE VITOLA TERAN', phone: '3103613152', municipality: 'OVEJAS' },
  { document: '92128741', name: 'PABLO ANTONIO CENTENO CORTEZ', phone: '3005261321', municipality: 'OVEJAS' },
  { document: '1888015', name: 'ANIBAL JOSE GONZALEZ GARRIDO', phone: '3007970434', municipality: 'OVEJAS' },
  { document: '1102148601', name: 'ALEX ANGULO RIVERO', phone: '3145063528', municipality: 'OVEJAS' },
  { document: '1887901', name: 'JOAQUIN ANTONIO GONZALEZ CONTRERAS', phone: '3103905217', municipality: 'OVEJAS' },
  { document: '1887681', name: 'BETSABE SEGUNDO BLANCO BENITEZ', phone: '3024188532', municipality: 'OVEJAS' },
  { document: '1101812419', name: 'OSCAR ANIBAL NARVAEZ OVIEDO', phone: '3105488048', municipality: 'OVEJAS' },
  { document: '1887822', name: 'HARLINTON GARCIA BARRETO', phone: '3126363991', municipality: 'OVEJAS' },
  { document: '1101814403', name: 'CARLOS ROBERTO ARAQUE GAMBOA', phone: '3043973417', municipality: 'OVEJAS' },
  { document: '3921096', name: 'JORGE LUIS HERRERA MENDOZA', phone: '3148833300', municipality: 'OVEJAS' },
  { document: '8722160', name: 'JOSE NOVOA TRUJILLO', phone: '3016753661', municipality: 'OVEJAS' },
  { document: '1888042', name: 'FREDY ANTONIO JARABA CAUSADO', phone: '3145034999', municipality: 'OVEJAS' },
  { document: '92499068', name: 'JOSE RICARDO RODRIGUEZ', phone: '3046442171', municipality: 'OVEJAS' },
  { document: '9307740', name: 'RAFAEL FRANCISCO MEDINA OSORIO', phone: '3015921941', municipality: 'OVEJAS' },
  { document: '3959494', name: 'SILVANO VERGARA DIAZ', phone: '3116516862', municipality: 'SAN MARCOS' },
  { document: '1085926581', name: 'VLADIMIR ZURITA', phone: '3104921217', municipality: 'SAN MARCOS' },
  { document: '1018502694', name: 'JAIRO JOSE HERNANDEZ SAENZ', phone: '3147784204', municipality: 'SAN MARCOS' },
  { document: '1876110', name: 'JESUS DIAZ', phone: '3217998340', municipality: 'BUENAVISTA' },
  { document: '7200886', name: 'JAIRO CARAÑO', phone: '3007010517', municipality: 'SINCE' },
  { document: '6489186', name: 'PIEDAD PEREZ PELUFFO', phone: '3145263542', municipality: 'OVEJAS' },
  { document: '1887915', name: 'LUIS GIL PUENTES', phone: '3207387189', municipality: 'OVEJAS' },
  { document: '1101814341', name: 'LINA MARIA PELUFFO RAMIREZ', phone: '3215436859', municipality: 'OVEJAS' },
  { document: '1888182', name: 'JUAN MERCADO', phone: '3145263542', municipality: 'OVEJAS' },
  { document: '7227100', name: 'HOLMAN MERIÑO', phone: '3206600577', municipality: 'OVEJAS' },
];

async function seedLeaders() {
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

    const leaderRepository = AppDataSource.getRepository(Leader);

    for (const leader of leaderData) {
      const existingLeader = await leaderRepository.findOne({
        where: { document: leader.document },
      });

      if (existingLeader) {
        console.log(`⚠ Leader with document ${leader.document} already exists. Skipping...`);
      } else {
        const newLeader = leaderRepository.create(leader);
        await leaderRepository.save(newLeader);
        console.log(`✓ Created leader: ${leader.name}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedLeaders();
