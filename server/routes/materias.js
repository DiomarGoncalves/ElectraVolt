import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET - Listar todas as matérias-primas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, 
             COUNT(pf.id) as total_fornecedores,
             COALESCE(AVG(pf.preco), 0) as preco_medio
      FROM materias_primas m
      LEFT JOIN precos_fornecedores pf ON m.id = pf.materia_id
      GROUP BY m.id
      ORDER BY m.nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar matérias-primas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar nova matéria-prima
router.post('/', async (req, res) => {
  const { nome, unidade, estoque = 0, descricao = '' } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO materias_primas (nome, unidade, estoque, descricao) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, unidade, estoque, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar matéria-prima
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, unidade, estoque, descricao } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE materias_primas SET nome = $1, unidade = $2, estoque = $3, descricao = $4 WHERE id = $5 RETURNING *',
      [nome, unidade, estoque, descricao, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Excluir matéria-prima
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM materias_primas WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    
    res.json({ message: 'Matéria-prima excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir matéria-prima:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;