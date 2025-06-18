import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DEFAULT_CONNECTION_STRING = 'postgresql://postgres:Diomar1205@db.wchacqfpdhstnsrsblaz.supabase.co:5432/postgres';

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