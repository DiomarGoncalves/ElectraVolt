import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Pool } from "pg"; // Instale com `npm install pg`
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Alterar para 3001 ou outra porta disponível

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Certifique-se de que a pasta "public" está no mesmo nível do arquivo index.js

// Configuração do multer para upload de imagens
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
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

// Rota para login do administrador
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }

  res.status(401).json({ error: "Credenciais inválidas" });
});

// Rota para listar produtos
app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// Rota para adicionar produto
app.post("/api/produtos", upload.single("image"), async (req, res) => {
  const { name, model, price } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      "INSERT INTO produtos (name, model, price, image) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, model, price, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    res.status(500).json({ error: "Erro ao adicionar produto" });
  }
});

// Rota para excluir produto
app.delete("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
    res.status(200).json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).json({ error: "Erro ao excluir produto" });
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
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Erro: A porta ${PORT} já está em uso.`);
  } else {
    console.error(err);
  }
});
