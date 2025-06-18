import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acesso negado' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check against environment variables
    if (username === process.env.ADMIN_USERNAME && 
        await bcrypt.compare(password, process.env.ADMIN_PASSWORD)) {
      
      // Generate token
      const token = jwt.sign(
        { username: process.env.ADMIN_USERNAME },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token válido' });
});

// Categories routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.type,
        COUNT(DISTINCT p.id) AS products_count,
        COUNT(DISTINCT m.id) AS materials_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN materials m ON c.id = m.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

app.get('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    
    const result = await pool.query(
      'INSERT INTO categories (name, description, type) VALUES ($1, $2, $3) RETURNING *',
      [name, description, type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type } = req.body;
    
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, type = $3 WHERE id = $4 RETURNING *',
      [name, description, type, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is in use
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1 UNION ALL SELECT COUNT(*) FROM materials WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0 || parseInt(checkResult.rows[1].count) > 0) {
      return res.status(400).json({ error: 'Não é possível excluir uma categoria em uso' });
    }
    
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

// Materials routes
app.get('/api/materials', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id, 
        m.name, 
        m.unit, 
        m.price, 
        m.stock,
        m.min_stock,
        m.category_id,
        c.name AS category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).json({ error: 'Erro ao buscar matérias-prima' });
  }
});

app.get('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        m.id, 
        m.name, 
        m.unit, 
        m.price, 
        m.stock,
        m.min_stock,
        m.category_id,
        c.name AS category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching material:', err);
    res.status(500).json({ error: 'Erro ao buscar matéria-prima' });
  }
});

app.post('/api/materials', authenticateToken, async (req, res) => {
  try {
    const { name, unit, price, stock, category_id, min_stock } = req.body;
    
    const result = await pool.query(
      'INSERT INTO materials (name, unit, price, stock, category_id, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, unit, price, stock, category_id, min_stock]
    );
    
    // Check if stock is below minimum
    if (stock < min_stock) {
      sendLowStockAlert(name, stock, min_stock, unit);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating material:', err);
    res.status(500).json({ error: 'Erro ao criar matéria-prima' });
  }
});

app.put('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, price, stock, category_id, min_stock } = req.body;
    
    const result = await pool.query(
      'UPDATE materials SET name = $1, unit = $2, price = $3, stock = $4, category_id = $5, min_stock = $6 WHERE id = $7 RETURNING *',
      [name, unit, price, stock, category_id, min_stock, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    
    // Check if stock is below minimum
    if (stock < min_stock) {
      sendLowStockAlert(name, stock, min_stock, unit);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating material:', err);
    res.status(500).json({ error: 'Erro ao atualizar matéria-prima' });
  }
});

app.delete('/api/materials/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if material is used in any product
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM product_composition WHERE material_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Não é possível excluir uma matéria-prima em uso em produtos' });
    }
    
    const result = await pool.query('DELETE FROM materials WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matéria-prima não encontrada' });
    }
    
    res.json({ message: 'Matéria-prima excluída com sucesso' });
  } catch (err) {
    console.error('Error deleting material:', err);
    res.status(500).json({ error: 'Erro ao excluir matéria-prima' });
  }
});

// Products routes
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.code, 
        p.description, 
        p.type, 
        p.category_id,
        c.name AS category_name,
        p.selling_price,
        p.cost,
        CASE 
          WHEN p.selling_price > 0 AND p.cost > 0 
          THEN ((p.selling_price - p.cost) / p.selling_price) * 100 
          ELSE 0 
        END AS profit_margin,
        p.stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    if (type) {
      query += ` WHERE p.type = '${type}'`;
    }
    
    query += ' ORDER BY p.name';
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product details
    const productResult = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.code, 
        p.description, 
        p.type, 
        p.category_id,
        c.name AS category_name,
        p.selling_price,
        p.cost,
        p.stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const product = productResult.rows[0];
    
    // If manufactured product, get composition
    if (product.type === 'manufactured') {
      const compositionResult = await pool.query(`
        SELECT 
          pc.material_id,
          m.name AS material_name,
          m.unit AS material_unit,
          pc.quantity
        FROM product_composition pc
        JOIN materials m ON pc.material_id = m.id
        WHERE pc.product_id = $1
      `, [id]);
      
      product.composition = compositionResult.rows;
    } else {
      product.composition = [];
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      name, code, description, type, category_id, 
      selling_price, cost, stock, composition 
    } = req.body;
    
    // Insert product
    const productResult = await client.query(
      'INSERT INTO products (name, code, description, type, category_id, selling_price, cost, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, code, description, type, category_id, selling_price, cost, stock]
    );
    
    const product = productResult.rows[0];
    
    // If manufactured product, insert composition
    if (type === 'manufactured' && composition && composition.length > 0) {
      for (const item of composition) {
        await client.query(
          'INSERT INTO product_composition (product_id, material_id, quantity) VALUES ($1, $2, $3)',
          [product.id, item.material_id, item.quantity]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  } finally {
    client.release();
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      name, code, description, type, category_id, 
      selling_price, cost, stock, composition 
    } = req.body;
    
    // Update product
    const productResult = await client.query(
      'UPDATE products SET name = $1, code = $2, description = $3, type = $4, category_id = $5, selling_price = $6, cost = $7, stock = $8 WHERE id = $9 RETURNING *',
      [name, code, description, type, category_id, selling_price, cost, stock, id]
    );
    
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const product = productResult.rows[0];
    
    // If manufactured product, update composition
    if (type === 'manufactured') {
      // Delete existing composition
      await client.query('DELETE FROM product_composition WHERE product_id = $1', [id]);
      
      // Insert new composition
      if (composition && composition.length > 0) {
        for (const item of composition) {
          await client.query(
            'INSERT INTO product_composition (product_id, material_id, quantity) VALUES ($1, $2, $3)',
            [product.id, item.material_id, item.quantity]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Check if profit margin is too low
    const profitMargin = ((selling_price - cost) / selling_price) * 100;
    if (profitMargin < 20) {
      sendLowMarginAlert(name, code, profitMargin);
    }
    
    res.json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  } finally {
    client.release();
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Delete composition first (if any)
    await client.query('DELETE FROM product_composition WHERE product_id = $1', [id]);
    
    // Delete product
    const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  } finally {
    client.release();
  }
});

// Suppliers routes
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.document, 
        s.contact_name, 
        s.phone, 
        s.email, 
        s.address,
        COUNT(DISTINCT sm.material_id) AS materials_count
      FROM suppliers s
      LEFT JOIN supplier_materials sm ON s.id = sm.supplier_id
      GROUP BY s.id
      ORDER BY s.name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
});

app.get('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching supplier:', err);
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, document, contact_name, phone, email, address } = req.body;
    
    const result = await pool.query(
      'INSERT INTO suppliers (name, document, contact_name, phone, email, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, document, contact_name, phone, email, address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, document, contact_name, phone, email, address } = req.body;
    
    const result = await pool.query(
      'UPDATE suppliers SET name = $1, document = $2, contact_name = $3, phone = $4, email = $5, address = $6 WHERE id = $7 RETURNING *',
      [name, document, contact_name, phone, email, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ error: 'Erro ao excluir fornecedor' });
  }
});

// Production routes
app.get('/api/production', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.product_id,
        pr.name AS product_name,
        p.quantity,
        p.production_date,
        p.status,
        p.notes
      FROM production p
      JOIN products pr ON p.product_id = pr.id
      ORDER BY p.production_date DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching production records:', err);
    res.status(500).json({ error: 'Erro ao buscar registros de produção' });
  }
});

app.post('/api/production', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { product_id, quantity, notes } = req.body;
    
    // Check if product exists and is manufactured
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1 AND type = $2',
      [product_id, 'manufactured']
    );
    
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado ou não é de fabricação própria' });
    }
    
    // Get product composition
    const compositionResult = await client.query(
      'SELECT material_id, quantity FROM product_composition WHERE product_id = $1',
      [product_id]
    );
    
    if (compositionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Produto não possui composição definida' });
    }
    
    // Check material availability
    for (const item of compositionResult.rows) {
      const materialResult = await client.query(
        'SELECT stock FROM materials WHERE id = $1',
        [item.material_id]
      );
      
      if (materialResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Material não encontrado' });
      }
      
      const material = materialResult.rows[0];
      const requiredQuantity = item.quantity * quantity;
      
      if (material.stock < requiredQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Estoque insuficiente de materiais' });
      }
    }
    
    // Create production record
    const productionResult = await client.query(
      'INSERT INTO production (product_id, quantity, production_date, status, notes) VALUES ($1, $2, NOW(), $3, $4) RETURNING *',
      [product_id, quantity, 'pending', notes]
    );
    
    // Reduce material stock
    for (const item of compositionResult.rows) {
      const requiredQuantity = item.quantity * quantity;
      
      await client.query(
        'UPDATE materials SET stock = stock - $1 WHERE id = $2',
        [requiredQuantity, item.material_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(productionResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating production record:', err);
    res.status(500).json({ error: 'Erro ao registrar produção' });
  } finally {
    client.release();
  }
});

app.put('/api/production/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (status !== 'completed' && status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Get production record
    const productionResult = await client.query(
      'SELECT * FROM production WHERE id = $1',
      [id]
    );
    
    if (productionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Registro de produção não encontrado' });
    }
    
    const production = productionResult.rows[0];
    
    if (production.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Apenas produções pendentes podem ser atualizadas' });
    }
    
    // Update production status
    await client.query(
      'UPDATE production SET status = $1 WHERE id = $2',
      [status, id]
    );
    
    if (status === 'completed') {
      // Increase product stock
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [production.quantity, production.product_id]
      );
    } else if (status === 'cancelled') {
      // Return materials to stock
      const compositionResult = await client.query(
        'SELECT material_id, quantity FROM product_composition WHERE product_id = $1',
        [production.product_id]
      );
      
      for (const item of compositionResult.rows) {
        const returnQuantity = item.quantity * production.quantity;
        
        await client.query(
          'UPDATE materials SET stock = stock + $1 WHERE id = $2',
          [returnQuantity, item.material_id]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Status de produção atualizado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating production status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status de produção' });
  } finally {
    client.release();
  }
});

// Sales routes
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    // Get all sales
    const salesResult = await pool.query(`
      SELECT id, date, total, profit, notes
      FROM sales
      ORDER BY date DESC
    `);
    
    const sales = salesResult.rows;
    
    // Get items for each sale
    for (const sale of sales) {
      const itemsResult = await pool.query(`
        SELECT 
          si.product_id,
          p.name AS product_name,
          si.quantity,
          si.price,
          si.cost
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = $1
      `, [sale.id]);
      
      sale.items = itemsResult.rows;
    }
    
    res.json(sales);
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { items, notes } = req.body;
    
    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nenhum item na venda' });
    }
    
    // Calculate total and profit
    let total = 0;
    let profit = 0;
    
    for (const item of items) {
      total += item.price * item.quantity;
      profit += (item.price - item.cost) * item.quantity;
    }
    
    // Create sale record
    const saleResult = await client.query(
      'INSERT INTO sales (date, total, profit, notes) VALUES (NOW(), $1, $2, $3) RETURNING *',
      [total, profit, notes]
    );
    
    const sale = saleResult.rows[0];
    
    // Add sale items and update product stock
    for (const item of items) {
      // Add sale item
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price, cost) VALUES ($1, $2, $3, $4, $5)',
        [sale.id, item.product_id, item.quantity, item.price, item.cost]
      );
      
      // Update product stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(sale);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', err);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  } finally {
    client.release();
  }
});

// Dashboard route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get counts
    const countsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM materials) AS total_materials,
        (SELECT COUNT(*) FROM suppliers) AS total_suppliers,
        (SELECT COUNT(*) FROM sales) AS total_sales
    `);
    
    // Get monthly profit
    const profitResult = await pool.query(`
      SELECT SUM(profit) AS monthly_profit
      FROM sales
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // Get low stock items
    const lowStockResult = await pool.query(`
      SELECT id, name, stock
      FROM materials
      WHERE stock < min_stock
      ORDER BY (stock / min_stock) ASC
      LIMIT 5
    `);
    
    // Get top products
    const topProductsResult = await pool.query(`
      SELECT 
        p.id,
        p.name,
        SUM(si.quantity * (si.price - si.cost)) AS profit
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY p.id, p.name
      ORDER BY profit DESC
      LIMIT 3
    `);
    
    // Get monthly sales
    const monthlySalesResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS month,
        SUM(total) AS amount
      FROM sales
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);
    
    const dashboard = {
      ...countsResult.rows[0],
      monthlyProfit: profitResult.rows[0]?.monthly_profit || 0,
      lowStockItems: lowStockResult.rows,
      topProducts: topProductsResult.rows,
      monthlySales: monthlySalesResult.rows
    };
    
    res.json(dashboard);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// Reports route
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { range } = req.query;
    let dateFilter;
    
    switch (range) {
      case 'month':
        dateFilter = "DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'quarter':
        dateFilter = "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')";
        break;
      case 'year':
        dateFilter = "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')";
        break;
      default:
        dateFilter = "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')";
    }
    
    // Get sales by month
    const salesByMonthQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS month,
        SUM(total) AS sales,
        SUM(profit) AS profit
      FROM sales
      WHERE date >= ${dateFilter}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `;
    
    const salesByMonthResult = await pool.query(salesByMonthQuery);
    
    // Get top products
    const topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        SUM(si.quantity) AS quantity,
        SUM(si.quantity * (si.price - si.cost)) AS profit
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.date >= ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY profit DESC
      LIMIT 5
    `;
    
    const topProductsResult = await pool.query(topProductsQuery);
    
    // Get top suppliers
    const topSuppliersQuery = `
      SELECT 
        s.id,
        s.name,
        SUM(sm.price * sm.quantity) AS total_purchases,
        SUM((sm.market_price - sm.price) * sm.quantity) AS savings
      FROM suppliers s
      JOIN supplier_materials sm ON s.id = sm.supplier_id
      WHERE sm.purchase_date >= ${dateFilter}
      GROUP BY s.id, s.name
      ORDER BY savings DESC
      LIMIT 4
    `;
    
    const topSuppliersResult = await pool.query(topSuppliersQuery);
    
    // Get inventory value
    const inventoryValueQuery = `
      SELECT 
        SUM(p.stock * p.cost) AS products,
        SUM(m.stock * m.price) AS materials,
        SUM(p.stock * p.cost) + SUM(m.stock * m.price) AS total
      FROM products p, materials m
    `;
    
    const inventoryValueResult = await pool.query(inventoryValueQuery);
    
    // Get profit margins distribution
    const profitMarginsQuery = `
      SELECT 
        CASE 
          WHEN profit_margin < 10 THEN '0-10%'
          WHEN profit_margin < 20 THEN '10-20%'
          WHEN profit_margin < 30 THEN '20-30%'
          WHEN profit_margin < 40 THEN '30-40%'
          WHEN profit_margin < 50 THEN '40-50%'
          ELSE '50%+'
        END AS range,
        COUNT(*) AS count
      FROM (
        SELECT 
          ((selling_price - cost) / selling_price) * 100 AS profit_margin
        FROM products
        WHERE selling_price > 0 AND cost > 0
      ) AS margins
      GROUP BY range
      ORDER BY range
    `;
    
    const profitMarginsResult = await pool.query(profitMarginsQuery);
    
    const report = {
      salesByMonth: salesByMonthResult.rows,
      topProducts: topProductsResult.rows,
      topSuppliers: topSuppliersResult.rows,
      inventoryValue: inventoryValueResult.rows[0],
      profitMargins: profitMarginsResult.rows
    };
    
    res.json(report);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// Helper functions
function sendLowStockAlert(materialName, currentStock, minStock, unit) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: 'Alerta de Estoque Baixo',
    html: `
      <h2>Alerta de Estoque Baixo</h2>
      <p>A matéria-prima <strong>${materialName}</strong> está com estoque abaixo do mínimo.</p>
      <ul>
        <li>Estoque atual: ${currentStock} ${unit}</li>
        <li>Estoque mínimo: ${minStock} ${unit}</li>
      </ul>
      <p>Por favor, providencie a reposição o mais breve possível.</p>
    `
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

function sendLowMarginAlert(productName, productCode, margin) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: 'Alerta de Margem de Lucro Baixa',
    html: `
      <h2>Alerta de Margem de Lucro Baixa</h2>
      <p>O produto <strong>${productName}</strong> (${productCode}) está com margem de lucro abaixo do recomendado.</p>
      <p>Margem atual: <strong>${margin.toFixed(2)}%</strong></p>
      <p>Recomendamos revisar o preço de venda ou buscar reduzir os custos de produção.</p>
    `
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});