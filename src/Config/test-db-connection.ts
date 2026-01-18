// server/test-db-connection.ts
import pool from './db.config';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

async function testConnection(): Promise<void> {
  console.log('🔍 Test de connexion à MySQL...');
  
  try {
    // Test 1: Vérifier la connexion
    const connection = await pool.getConnection();
    console.log('Connexion à MySQL réussie ✔');
    
    // Test 2: Vérifier que la base de données existe
    const [rows] = await connection.query<RowDataPacket[]>('SELECT DATABASE() as db');
    console.log(`Base de données connectée: ${(rows[0] as RowDataPacket).db} ✔`);

    // Test 3: Lister les tables
    const [tables] = await connection.query<RowDataPacket[]>(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    console.log('📋 Tables disponibles:');
    (tables as RowDataPacket[]).forEach(table => console.log(`  - ${(table as RowDataPacket).TABLE_NAME}`));

    // Test 4: Vérifier la table etudiants
    try {
      const [etudiants] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM etudiants');
      console.log(`👨‍🎓 Nombre d'étudiants: ${(etudiants[0] as RowDataPacket).count}`);
    } catch (err) {
      console.log('✖ Table etudiants non trouvée - exécutez le script SQL');
    }
    
    connection.release();

    // Test 5: Tester avec une requête simple
    const [result] = await pool.query<RowDataPacket[]>('SELECT 1 + 1 as result');
    console.log(`Test de calcul: 1 + 1 = ${(result[0] as any).result} ✔`);

    console.log('Tous les tests de connexion sont réussis ✔ !');
    process.exit(0);
  } catch (error) {
    console.error('✖ Erreur de connexion MySQL:', (error as Error).message ?? error);
    console.log('\n🔧 Vérifiez:');
    console.log('1. MySQL est-il démarré? (sudo service mysql start)');
    console.log('2. Les identifiants dans .env sont-ils corrects?');
    console.log('3. La base de données existe-t-elle?');
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default testConnection;