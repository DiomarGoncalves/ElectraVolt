import fs from "fs";
import path from "path";

const veiculosPath = path.join(process.cwd(), "data", "veiculos.json");

export default function handler(req, res) {
  if (req.method === "GET") {
    // Rota para listar veículos
    fs.readFile(veiculosPath, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Erro ao ler os dados" });
      res.status(200).json(JSON.parse(data));
    });
  } else if (req.method === "POST") {
    // Rota para adicionar veículo
    const novoVeiculo = req.body;
    fs.readFile(veiculosPath, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Erro ao ler os dados" });
      const veiculos = JSON.parse(data);
      novoVeiculo.id = veiculos.length + 1;
      veiculos.push(novoVeiculo);
      fs.writeFile(veiculosPath, JSON.stringify(veiculos, null, 2), (err) => {
        if (err) return res.status(500).json({ error: "Erro ao salvar os dados" });
        res.status(201).json(novoVeiculo);
      });
    });
  } else if (req.method === "DELETE") {
    // Rota para excluir veículo
    const id = parseInt(req.query.id);
    fs.readFile(veiculosPath, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Erro ao ler os dados" });
      let veiculos = JSON.parse(data);
      veiculos = veiculos.filter((veiculo) => veiculo.id !== id);
      fs.writeFile(veiculosPath, JSON.stringify(veiculos, null, 2), (err) => {
        if (err) return res.status(500).json({ error: "Erro ao salvar os dados" });
        res.status(200).json({ message: "Veículo excluído com sucesso" });
      });
    });
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
