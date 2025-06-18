/*
  # Seed Initial Data for Product Management System

  1. Seed Data
    - Categories for products and materials
    - Sample materials
    - Sample products (both resale and manufactured)
    - Sample suppliers
    - Sample supplier materials
    - Sample production records
    - Sample sales data
*/

-- Seed categories
INSERT INTO categories (name, description, type) VALUES
('Móveis', 'Móveis para escritório e residência', 'product'),
('Iluminação', 'Produtos de iluminação', 'product'),
('Decoração', 'Itens decorativos', 'product'),
('Escritório', 'Produtos para escritório', 'product'),
('Madeiras', 'Tipos de madeira para fabricação', 'material'),
('Ferragens', 'Parafusos, dobradiças e outras ferragens', 'material'),
('Tintas', 'Tintas e vernizes', 'material'),
('Tecidos', 'Tecidos para estofados', 'material'),
('Elétricos', 'Componentes elétricos', 'material'),
('Acessórios', 'Acessórios diversos', 'both')
ON CONFLICT DO NOTHING;

-- Seed materials
INSERT INTO materials (name, unit, price, stock, min_stock, category_id) VALUES
('Madeira MDF', 'm²', 45.00, 50, 10, 5),
('Parafuso 10mm', 'un', 0.25, 500, 100, 6),
('Tinta Branca', 'L', 28.90, 20, 5, 7),
('Dobradiça', 'un', 5.50, 100, 20, 6),
('Puxador Metálico', 'un', 12.80, 45, 10, 6),
('Tecido Estofado Azul', 'm²', 35.00, 30, 5, 8),
('Tecido Estofado Cinza', 'm²', 38.50, 25, 5, 8),
('Vidro Temperado', 'm²', 120.00, 15, 3, 10),
('Lâmpada LED', 'un', 15.90, 50, 10, 9),
('Fio Elétrico', 'm', 1.20, 200, 50, 9),
('Espuma D33', 'm²', 25.00, 20, 5, 8),
('Cola para Madeira', 'L', 18.50, 10, 2, 10),
('Verniz', 'L', 32.00, 8, 2, 7),
('Prateleira de Vidro', 'un', 45.00, 15, 5, 10),
('Rodízio para Móveis', 'un', 8.50, 60, 12, 6)
ON CONFLICT DO NOTHING;

-- Seed products (resale)
INSERT INTO products (name, code, description, type, category_id, selling_price, cost, stock) VALUES
('Luminária LED', 'LUM001', 'Luminária de mesa com LED', 'resale', 2, 89.90, 45.00, 30),
('Porta-Canetas', 'PCN001', 'Porta-canetas em acrílico', 'resale', 4, 25.00, 12.50, 40),
('Vaso Decorativo', 'VAS001', 'Vaso decorativo em cerâmica', 'resale', 3, 75.00, 38.00, 15),
('Quadro Abstrato', 'QUA001', 'Quadro com arte abstrata', 'resale', 3, 120.00, 65.00, 8),
('Organizador de Mesa', 'ORG001', 'Organizador de mesa em madeira', 'resale', 4, 55.00, 28.00, 20)
ON CONFLICT DO NOTHING;

-- Seed products (manufactured)
INSERT INTO products (name, code, description, type, category_id, selling_price, cost, stock) VALUES
('Cadeira Ergonômica', 'CAD001', 'Cadeira ergonômica para escritório', 'manufactured', 1, 450.00, 280.00, 15),
('Mesa de Escritório', 'MES001', 'Mesa para escritório com gavetas', 'manufactured', 1, 650.00, 420.00, 8),
('Estante Modular', 'EST001', 'Estante modular para livros e decoração', 'manufactured', 1, 380.00, 210.00, 12),
('Poltrona Reclinável', 'POL001', 'Poltrona reclinável estofada', 'manufactured', 1, 580.00, 350.00, 6),
('Mesa de Centro', 'MES002', 'Mesa de centro com tampo de vidro', 'manufactured', 1, 320.00, 180.00, 10)
ON CONFLICT DO NOTHING;

-- Seed product composition
INSERT INTO product_composition (product_id, material_id, quantity) VALUES
-- Cadeira Ergonômica (CAD001)
(6, 1, 0.5),  -- Madeira MDF
(6, 2, 12),   -- Parafuso 10mm
(6, 6, 0.8),  -- Tecido Estofado Azul
(6, 11, 0.5), -- Espuma D33
(6, 15, 4),   -- Rodízio para Móveis

-- Mesa de Escritório (MES001)
(7, 1, 2),    -- Madeira MDF
(7, 2, 16),   -- Parafuso 10mm
(7, 4, 4),    -- Dobradiça
(7, 5, 2),    -- Puxador Metálico
(7, 13, 0.2), -- Verniz

-- Estante Modular (EST001)
(8, 1, 3),    -- Madeira MDF
(8, 2, 24),   -- Parafuso 10mm
(8, 3, 0.5),  -- Tinta Branca
(8, 14, 4),   -- Prateleira de Vidro

-- Poltrona Reclinável (POL001)
(9, 1, 0.8),  -- Madeira MDF
(9, 2, 20),   -- Parafuso 10mm
(9, 7, 2),    -- Tecido Estofado Cinza
(9, 11, 1.5), -- Espuma D33
(9, 4, 2),    -- Dobradiça

-- Mesa de Centro (MES002)
(10, 1, 0.5), -- Madeira MDF
(10, 2, 8),   -- Parafuso 10mm
(10, 8, 0.8), -- Vidro Temperado
(10, 13, 0.1) -- Verniz
ON CONFLICT DO NOTHING;

-- Seed suppliers
INSERT INTO suppliers (name, document, contact_name, phone, email, address) VALUES
('Madeiras Brasil Ltda', '12.345.678/0001-90', 'João Silva', '(11) 98765-4321', 'contato@madeirasbrasil.com.br', 'Av. Industrial, 1500, São Paulo - SP'),
('Ferragens & Cia', '23.456.789/0001-01', 'Maria Oliveira', '(11) 97654-3210', 'vendas@ferragensecia.com.br', 'Rua das Ferramentas, 250, São Paulo - SP'),
('Tintas Coloridas S.A.', '34.567.890/0001-12', 'Pedro Santos', '(11) 96543-2109', 'atendimento@tintascoloridas.com.br', 'Rua das Cores, 100, Guarulhos - SP'),
('Tecidos & Estofados', '45.678.901/0001-23', 'Ana Souza', '(11) 95432-1098', 'vendas@tecidosestofados.com.br', 'Av. dos Tecidos, 500, Osasco - SP'),
('Vidraçaria Cristal', '56.789.012/0001-34', 'Carlos Ferreira', '(11) 94321-0987', 'contato@vidracariacristal.com.br', 'Rua do Vidro, 300, São Paulo - SP')
ON CONFLICT DO NOTHING;

-- Seed supplier materials (purchase history)
INSERT INTO supplier_materials (supplier_id, material_id, price, market_price, quantity, purchase_date, notes) VALUES
(1, 1, 42.00, 48.00, 100, NOW() - INTERVAL '30 days', 'Compra mensal'),
(2, 2, 0.22, 0.30, 1000, NOW() - INTERVAL '15 days', 'Desconto por quantidade'),
(2, 4, 5.00, 6.00, 200, NOW() - INTERVAL '15 days', 'Desconto por quantidade'),
(2, 5, 11.50, 13.00, 50, NOW() - INTERVAL '15 days', 'Desconto por quantidade'),
(3, 3, 26.50, 30.00, 30, NOW() - INTERVAL '20 days', 'Promoção sazonal'),
(3, 13, 29.00, 35.00, 15, NOW() - INTERVAL '20 days', 'Promoção sazonal'),
(4, 6, 32.00, 38.00, 50, NOW() - INTERVAL '25 days', 'Compra programada'),
(4, 7, 35.00, 40.00, 40, NOW() - INTERVAL '25 days', 'Compra programada'),
(4, 11, 22.00, 28.00, 30, NOW() - INTERVAL '25 days', 'Compra programada'),
(5, 8, 110.00, 130.00, 20, NOW() - INTERVAL '10 days', 'Negociação especial')
ON CONFLICT DO NOTHING;

-- Seed production records
INSERT INTO production (product_id, quantity, production_date, status, notes) VALUES
(6, 5, NOW() - INTERVAL '20 days', 'completed', 'Produção concluída com sucesso'),
(7, 3, NOW() - INTERVAL '15 days', 'completed', 'Produção para estoque'),
(8, 4, NOW() - INTERVAL '10 days', 'completed', 'Produção normal'),
(9, 2, NOW() - INTERVAL '5 days', 'completed', 'Produção sob demanda'),
(10, 3, NOW() - INTERVAL '3 days', 'completed', 'Produção para exposição'),
(6, 3, NOW() - INTERVAL '1 day', 'pending', 'Em andamento')
ON CONFLICT DO NOTHING;

-- Seed sales
DO $$
DECLARE
  sale_id1 INTEGER;
  sale_id2 INTEGER;
  sale_id3 INTEGER;
BEGIN
  -- First sale
  INSERT INTO sales (date, total, profit, notes) 
  VALUES (NOW() - INTERVAL '18 days', 989.90, 385.90, 'Cliente: Empresa ABC')
  RETURNING id INTO sale_id1;
  
  INSERT INTO sale_items (sale_id, product_id, quantity, price, cost) VALUES
  (sale_id1, 6, 2, 450.00, 280.00),  -- 2 Cadeiras Ergonômicas
  (sale_id1, 1, 1, 89.90, 45.00);    -- 1 Luminária LED
  
  -- Second sale
  INSERT INTO sales (date, total, profit, notes) 
  VALUES (NOW() - INTERVAL '10 days', 650.00, 230.00, 'Cliente: João Silva')
  RETURNING id INTO sale_id2;
  
  INSERT INTO sale_items (sale_id, product_id, quantity, price, cost) VALUES
  (sale_id2, 7, 1, 650.00, 420.00);  -- 1 Mesa de Escritório
  
  -- Third sale
  INSERT INTO sales (date, total, profit, notes) 
  VALUES (NOW() - INTERVAL '5 days', 1029.70, 474.70, 'Cliente: Maria Oliveira')
  RETURNING id INTO sale_id3;
  
  INSERT INTO sale_items (sale_id, product_id, quantity, price, cost) VALUES
  (sale_id3, 8, 2, 380.00, 210.00),  -- 2 Estantes Modulares
  (sale_id3, 1, 3, 89.90, 45.00);    -- 3 Luminárias LED
END $$;