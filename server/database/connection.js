import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DEFAULT_CONNECTION_STRING = 'postgresql://ElectraVolts_owner:npg_melhP5KXgRo6@ep-odd-bird-a4hern8o-pooler.us-east-1.aws.neon.tech/ElectraVolts?sslmode=require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || DEFAULT_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL (Neon)');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

export default pool;