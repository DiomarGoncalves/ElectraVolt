import { AppState, Produto, CalculoCusto } from '../types';

export const calcularCustoProduto = (
  produto: Produto,
  state: AppState
): CalculoCusto => {
  let custoMateriais = 0;
  const breakdown: CalculoCusto['breakdown'] = [];

  // Garante que a composição é um array
  const composicao = Array.isArray(produto.composicao) ? produto.composicao : [];

  // Calcular custo de cada material na composição
  composicao.forEach(item => {
    const materia = state.materiasPrimas.find(m => m.id === item.materia_id);
    const fornecedor = state.fornecedores.find(f => f.id === item.fornecedor_id);
    const preco = state.precosFornecedores.find(
      p => p.materia_id === item.materia_id && p.fornecedor_id === item.fornecedor_id
    );

    if (materia && fornecedor && preco) {
      const custoItem = item.quantidade * preco.preco;
      custoMateriais += custoItem;

      breakdown.push({
        materia_id: item.materia_id,
        nome: materia.nome,
        quantidade: item.quantidade,
        precoUnitario: preco.preco,
        custoTotal: custoItem,
        fornecedor: fornecedor.nome,
      });
    }
  });

  // Custo total é apenas o custo dos materiais (sem custos adicionais)
  const custoTotal = custoMateriais;
  const precoVenda = produto.preco_venda;
  
  // Calcular margem e lucro
  const lucroAbsoluto = precoVenda - custoTotal;
  const margemLucro = custoTotal > 0 ? (lucroAbsoluto / custoTotal) * 100 : 0;

  return {
    custoMateriais,
    custoTotal,
    precoVenda,
    margemLucro,
    lucroAbsoluto,
    breakdown,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercentage = (value: number | undefined | null): string => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${safeValue.toFixed(2)}%`;
};

export const gerarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};