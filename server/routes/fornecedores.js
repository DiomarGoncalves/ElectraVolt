import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET - Listar todos os fornecedores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, 
             COUNT(pf.id) as total_precos
      FROM fornecedores f
      LEFT JOIN precos_fornecedores pf ON f.id = pf.fornecedor_id
      GROUP BY f.id
      ORDER BY f.nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo fornecedor
router.post('/', async (req, res) => {
  const { nome, cnpj, telefone, email } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO fornecedores (nome, cnpj, telefone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, cnpj, telefone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'CNPJ já cadastrado' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// PUT - Atualizar fornecedor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, email } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE fornecedores SET nome = $1, cnpj = $2, telefone = $3, email = $4 WHERE id = $5 RETURNING *',
      [nome, cnpj, telefone, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Excluir fornecedor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM fornecedores WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;