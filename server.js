import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"; // Instale com `npm install jsonwebtoken`

dotenv.config(); // Carregar variáveis de ambiente do arquivo .env

const { Pool } = pkg; // Extraindo Pool do pacote pg

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Certifique-se de que este middleware está configurado
app.use("/uploads", express.static("public/uploads")); // Certifique-se de que este middleware está configurado

// Middleware para autenticação básica
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
};

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // String de conexão do Neon
  ssl: { rejectUnauthorized: false }, // Necessário para conexões seguras
});

// Rota para login do administrador
app.post("/api/login", (req, res) => {
  const username = req.body.username || req.query.username;
  const password = req.body.password || req.query.password;

  console.log("Tentativa de login:", username); // Log para depuração

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    console.log("Login bem-sucedido para:", username); // Log para depuração
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }

  console.error("Credenciais inválidas para:", username); // Log para depuração
  res.status(401).json({ error: "Credenciais inválidas" });
});

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.user = decoded;
    next();
  });
};

// Rota para listar veículos
app.get("/api/veiculos", async (req, res) => {
  try {
    console.log("Recebida requisição GET em /api/veiculos");
    const { rows } = await pool.query("SELECT id, name, year, price, image FROM veiculos");
    console.log("Veículos carregados com sucesso:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    res.status(500).json({ error: "Erro ao buscar veículos" });
  }
});

// Rota para adicionar veículo
app.post("/api/veiculos", async (req, res) => {
  const { name, year, price, image } = req.body; // `image` será uma URL
  try {
    const result = await pool.query(
      "INSERT INTO veiculos (name, year, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, year, price, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar veículo:", error);
    res.status(500).json({ error: "Erro ao adicionar veículo" });
  }
});

// Rota para excluir veículo
app.delete("/api/veiculos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM veiculos WHERE id = $1", [id]);
    res.status(200).json({ message: "Veículo excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir veículo:", error);
    res.status(500).json({ error: "Erro ao excluir veículo" });
  }
});

// Rota protegida para administração
app.use("/api/admin", verifyToken, (req, res) => {
  res.json({ message: "Bem-vindo à área administrativa!" });
});

// Middleware para lidar com rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});