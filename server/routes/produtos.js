import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// GET - Listar todos os produtos com composição
router.get('/', async (req, res) => {
  try {
    const produtosResult = await pool.query(`
      SELECT * FROM produtos ORDER BY nome
    `);
    
    const produtos = [];
    
    for (const produto of produtosResult.rows) {
      const composicaoResult = await pool.query(`
        SELECT cp.*, 
               m.nome as materia_nome,
               m.unidade,
               f.nome as fornecedor_nome,
               pf.preco
        FROM composicao_produtos cp
        JOIN materias_primas m ON cp.materia_id = m.id
        JOIN fornecedores f ON cp.fornecedor_id = f.id
        JOIN precos_fornecedores pf ON cp.materia_id = pf.materia_id AND cp.fornecedor_id = pf.fornecedor_id
        WHERE cp.produto_id = $1
        ORDER BY m.nome
      `, [produto.id]);
      
      produtos.push({
        ...produto,
        composicao: composicaoResult.rows
      });
    }
    
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar produto específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const produtoResult = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    
    if (produtoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const composicaoResult = await pool.query(`
      SELECT cp.*, 
             m.nome as materia_nome,
             m.unidade,
             f.nome as fornecedor_nome,
             pf.preco
      FROM composicao_produtos cp
      JOIN materias_primas m ON cp.materia_id = m.id
      JOIN fornecedores f ON cp.fornecedor_id = f.id
      JOIN precos_fornecedores pf ON cp.materia_id = pf.materia_id AND cp.fornecedor_id = pf.fornecedor_id
      WHERE cp.produto_id = $1
      ORDER BY m.nome
    `, [id]);
    
    const produto = {
      ...produtoResult.rows[0],
      composicao: composicaoResult.rows
    };
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo produto
router.post('/', async (req, res) => {
  const { nome, preco_venda, composicao } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Criar produto
    const produtoResult = await client.query(
      'INSERT INTO produtos (nome, preco_venda) VALUES ($1, $2) RETURNING *',
      [nome, preco_venda]
    );
    
    const produto = produtoResult.rows[0];
    
    // Adicionar itens da composição
    for (const item of composicao) {
      await client.query(
        'INSERT INTO composicao_produtos (produto_id, materia_id, fornecedor_id, quantidade) VALUES ($1, $2, $3, $4)',
        [produto.id, item.materia_id, item.fornecedor_id, item.quantidade]
      );
    }
    
    await client.query('COMMIT');
    
    // Buscar produto completo para retornar
    const produtoCompleto = await pool.query(`
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'id', cp.id,
                 'materia_id', cp.materia_id,
                 'fornecedor_id', cp.fornecedor_id,
                 'quantidade', cp.quantidade,
                 'materia_nome', m.nome,
                 'fornecedor_nome', f.nome,
                 'preco', pf.preco
               )
             ) as composicao
      FROM produtos p
      LEFT JOIN composicao_produtos cp ON p.id = cp.produto_id
      LEFT JOIN materias_primas m ON cp.materia_id = m.id
      LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
      LEFT JOIN precos_fornecedores pf ON cp.materia_id = pf.materia_id AND cp.fornecedor_id = pf.fornecedor_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [produto.id]);
    
    res.status(201).json(produtoCompleto.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// PUT - Atualizar produto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco_venda, composicao } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Atualizar produto
    const produtoResult = await client.query(
      'UPDATE produtos SET nome = $1, preco_venda = $2 WHERE id = $3 RETURNING *',
      [nome, preco_venda, id]
    );
    
    if (produtoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Remover composição antiga
    await client.query('DELETE FROM composicao_produtos WHERE produto_id = $1', [id]);
    
    // Adicionar nova composição
    for (const item of composicao) {
      await client.query(
        'INSERT INTO composicao_produtos (produto_id, materia_id, fornecedor_id, quantidade) VALUES ($1, $2, $3, $4)',
        [id, item.materia_id, item.fornecedor_id, item.quantidade]
      );
    }
    
    await client.query('COMMIT');
    
    res.json(produtoResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// DELETE - Excluir produto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;