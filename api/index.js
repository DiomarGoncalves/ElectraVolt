import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken"; // Instale com `npm install jsonwebtoken`
import dotenv from "dotenv";

dotenv.config(); // Carregar variáveis de ambiente do arquivo .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware para servir a pasta de uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Caminho do "banco de dados"
const veiculosPath = path.resolve(__dirname, "../data/veiculos.json");

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

  console.log("Tentativa de login:", username); // Log para depuração

  // Verificar credenciais (substitua por uma lógica mais robusta se necessário)
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    console.log("Login bem-sucedido para:", username); // Log para depuração
    // Gerar token JWT
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }

  console.error("Credenciais inválidas para:", username); // Log para depuração
  res.status(401).json({ error: "Credenciais inválidas" });
});

// Rota protegida para administração
app.use("/api/admin", verifyToken, (req, res) => {
  res.json({ message: "Bem-vindo à área administrativa!" });
});

// Rota para listar veículos
app.get("/api/veiculos", (req, res) => {
  console.log("Recebida requisição GET em /api/veiculos");

  if (!fs.existsSync(veiculosPath)) {
    console.warn("Arquivo veiculos.json não encontrado. Criando um novo arquivo...");
    fs.writeFileSync(veiculosPath, JSON.stringify([], null, 2), "utf8");
  }

  fs.readFile(veiculosPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo veiculos.json:", err);
      return res.status(500).json({ error: "Erro ao ler os dados do servidor" });
    }
    try {
      const veiculos = JSON.parse(data);
      console.log("Veículos carregados com sucesso:", veiculos);
      res.json(veiculos);
    } catch (parseError) {
      console.error("Erro ao parsear o arquivo veiculos.json:", parseError);
      res.status(500).json({ error: "Erro ao processar os dados do servidor" });
    }
  });
});

// Rota para adicionar veículo
app.post("/api/veiculos", (req, res) => {
  const novoVeiculo = req.body;

  fs.readFile(veiculosPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo veiculos.json:", err);
      return res.status(500).json({ error: "Erro ao ler os dados" });
    }

    const veiculos = JSON.parse(data);
    novoVeiculo.id = veiculos.length + 1;
    veiculos.push(novoVeiculo);

    fs.writeFile(veiculosPath, JSON.stringify(veiculos, null, 2), (err) => {
      if (err) {
        console.error("Erro ao salvar o arquivo veiculos.json:", err);
        return res.status(500).json({ error: "Erro ao salvar os dados" });
      }
      res.status(201).json(novoVeiculo);
    });
  });
});

// Rota para excluir veículo
app.delete("/api/veiculos/:id", (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile(veiculosPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erro ao ler o arquivo veiculos.json:", err);
      return res.status(500).json({ error: "Erro ao ler os dados" });
    }

    let veiculos = JSON.parse(data);
    veiculos = veiculos.filter((veiculo) => veiculo.id !== id);

    fs.writeFile(veiculosPath, JSON.stringify(veiculos, null, 2), (err) => {
      if (err) {
        console.error("Erro ao salvar o arquivo veiculos.json:", err);
        return res.status(500).json({ error: "Erro ao salvar os dados" });
      }
      res.status(200).json({ message: "Veículo excluído com sucesso" });
    });
  });
});

// Middleware para lidar com rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
