import { createPool, Pool, PoolOptions } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolOptions & { enableKeepAlive?: boolean; keepAliveInitialDelay?: number } = {
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'sigif_students_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool: Pool = createPool(poolConfig);

// Test de la connexion
export const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✔ Connexion MySQL établie avec succès');
    connection.release();
  } catch (err) {
    console.error(
      '✖ Erreur de connexion MySQL:',
      (err as Error).message ?? err
    );
    throw err;
  }
};

export default pool;