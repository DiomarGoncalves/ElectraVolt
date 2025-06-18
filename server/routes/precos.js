import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET - Listar todos os preços
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pf.*, 
             f.nome as fornecedor_nome,
             m.nome as materia_nome,
             m.unidade
      FROM precos_fornecedores pf
      JOIN fornecedores f ON pf.fornecedor_id = f.id
      JOIN materias_primas m ON pf.materia_id = m.id
      ORDER BY m.nome, f.nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Preços por matéria-prima
router.get('/materia/:materiaId', async (req, res) => {
  const { materiaId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT pf.*, 
             f.nome as fornecedor_nome
      FROM precos_fornecedores pf
      JOIN fornecedores f ON pf.fornecedor_id = f.id
      WHERE pf.materia_id = $1
      ORDER BY pf.preco
    `, [materiaId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar preços da matéria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar/Atualizar preço
router.post('/', async (req, res) => {
  const { fornecedor_id, materia_id, preco } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO precos_fornecedores (fornecedor_id, materia_id, preco) 
      VALUES ($1, $2, $3)
      ON CONFLICT (fornecedor_id, materia_id) 
      DO UPDATE SET preco = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [fornecedor_id, materia_id, preco]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar preço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Excluir preço
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM precos_fornecedores WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preço não encontrado' });
    }
    
    res.json({ message: 'Preço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir preço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;