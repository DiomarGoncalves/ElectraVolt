import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database/connection.js';

// Importar rotas
import fornecedoresRoutes from './routes/fornecedores.js';
import materiasRoutes from './routes/materias.js';
import precosRoutes from './routes/precos.js';
import produtosRoutes from './routes/produtos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/precos', precosRoutes);
app.use('/api/produtos', produtosRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API do Sistema de Custos funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar conexão com banco
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK', 
      database: 'Conectado',
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Erro na conexão com banco:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Erro na conexão',
      error: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Remova ou comente o bloco abaixo:
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;