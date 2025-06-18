import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calculator, TrendingUp, TrendingDown, Shuffle } from 'lucide-react';
import { Produto, ComposicaoItem } from '../types';
import { calcularCustoProduto, formatCurrency } from '../utils/calculations';

interface SimulacaoItem extends ComposicaoItem {
  original?: boolean;
}

const Simulacoes: React.FC = () => {
  const { state } = useApp();
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | ''>('');
  const [simulacaoComposicao, setSimulacaoComposicao] = useState<SimulacaoItem[]>([]);
  const [showComparativo, setShowComparativo] = useState(false);

  const selectedProduto = state.produtos.find(p => p.id === selectedProdutoId);

  // Carregar composição do produto selecionado
  const loadProdutoComposicao = (produtoId: number) => {
    const produto = state.produtos.find(p => p.id === produtoId);
    if (produto) {
      const composicaoWithOriginal = produto.composicao.map(item => ({
        ...item,
        original: true,
      }));
      setSimulacaoComposicao(composicaoWithOriginal);
      setShowComparativo(true);
    }
  };

  // Alterar fornecedor de um item específico
  const alterarFornecedor = (itemId: number, novoFornecedorId: number) => {
    setSimulacaoComposicao(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, fornecedor_id: novoFornecedorId, original: false }
        : item
    ));
  };

  // Calcular custos com composição original e simulada
  const calculos = useMemo(() => {
    if (!selectedProduto) return null;

    const original = calcularCustoProduto(selectedProduto, state);

    const simulacao = calcularCustoProduto({
      ...selectedProduto,
      composicao: simulacaoComposicao,
    }, state);

    return {
      original,
      simulacao,
      diferenca: {
        custoTotal: simulacao.custoTotal - original.custoTotal,
        precoVenda: simulacao.precoVenda - original.precoVenda,
        lucroAbsoluto: simulacao.lucroAbsoluto - original.lucroAbsoluto,
      },
    };
  }, [selectedProduto, simulacaoComposicao, state]);

  // Obter fornecedores disponíveis para uma matéria-prima
  const getFornecedoresByMateria = (materia_id: number) => {
    const precos = state.precosFornecedores.filter(p => p.materia_id === materia_id);
    return precos.map(p => {
      const fornecedor = state.fornecedores.find(f => f.id === p.fornecedor_id);
      return {
        id: p.fornecedor_id,
        nome: fornecedor?.nome || 'Fornecedor não encontrado',
        preco: p.preco,
      };
    });
  };

  const getMateriaNome = (materia_id: number) => {
    const materia = state.materiasPrimas.find(m => m.id === materia_id);
    return materia?.nome || 'Material não encontrado';
  };

  const getFornecedorNome = (fornecedor_id: number) => {
    const fornecedor = state.fornecedores.find(f => f.id === fornecedor_id);
    return fornecedor?.nome || 'Fornecedor não encontrado';
  };

  // Gerar simulação automática com melhores preços
  const gerarSimulacaoOtima = () => {
    if (!selectedProduto) return;

    const melhorComposicao = selectedProduto.composicao.map(item => {
      const fornecedores = getFornecedoresByMateria(item.materia_id);
      const melhorFornecedor = fornecedores.reduce((melhor, atual) => 
        atual.preco < melhor.preco ? atual : melhor
      , fornecedores[0]);

      return {
        ...item,
        fornecedor_id: melhorFornecedor?.id || item.fornecedor_id,
        original: melhorFornecedor?.id === item.fornecedor_id,
      };
    });

    setSimulacaoComposicao(melhorComposicao);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Simulações de Custos</h2>
          <p className="text-gray-600 mt-1">Teste diferentes combinações de fornecedores</p>
        </div>
      </div>

      {/* Seleção de Produto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Produto para Simulação</h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedProdutoId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedProdutoId(id || '');
                setShowComparativo(false);
                setSimulacaoComposicao([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um produto</option>
              {state.produtos.map(produto => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>
          
          {selectedProdutoId && (
            <div className="flex space-x-2">
              <button
                onClick={() => loadProdutoComposicao(Number(selectedProdutoId))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Carregar Composição
              </button>
              
              {showComparativo && (
                <button
                  onClick={gerarSimulacaoOtima}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Otimizar Custos
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simulação */}
      {showComparativo && selectedProduto && calculos && (
        <div className="space-y-6">
          {/* Comparativo de Resultados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo de Custos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Original */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Composição Original</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(calculos.original.custoTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Preço Venda:</span>
                    <span className="font-medium">{formatCurrency(calculos.original.precoVenda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lucro:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculos.original.lucroAbsoluto)}</span>
                  </div>
                </div>
              </div>

              {/* Simulação */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">Simulação</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(calculos.simulacao.custoTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Preço Venda:</span>
                    <span className="font-medium">{formatCurrency(calculos.simulacao.precoVenda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-blue-600">Lucro:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculos.simulacao.lucroAbsoluto)}</span>
                  </div>
                </div>
              </div>

              {/* Diferença */}
              <div className={`p-4 rounded-lg ${
                calculos.diferenca.custoTotal < 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  calculos.diferenca.custoTotal < 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  Diferença
                  {calculos.diferenca.custoTotal < 0 ? (
                    <TrendingDown className="inline h-4 w-4 ml-1" />
                  ) : (
                    <TrendingUp className="inline h-4 w-4 ml-1" />
                  )}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Custo:</span>
                    <span className={`font-medium ${
                      calculos.diferenca.custoTotal < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculos.diferenca.custoTotal >= 0 ? '+' : ''}
                      {formatCurrency(calculos.diferenca.custoTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className={`font-medium ${
                      calculos.diferenca.precoVenda < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculos.diferenca.precoVenda >= 0 ? '+' : ''}
                      {formatCurrency(calculos.diferenca.precoVenda)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lucro:</span>
                    <span className={`font-medium ${
                      calculos.diferenca.lucroAbsoluto > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculos.diferenca.lucroAbsoluto >= 0 ? '+' : ''}
                      {formatCurrency(calculos.diferenca.lucroAbsoluto)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Simulação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Composição da Simulação</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Material</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-left">Fornecedor Original</th>
                    <th className="px-4 py-3 text-left">Simular com:</th>
                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Economia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {simulacaoComposicao.map((item) => {
                    const itemOriginal = selectedProduto.composicao.find(orig => orig.id === item.id);
                    const fornecedoresDisponiveis = getFornecedoresByMateria(item.materia_id);
                    const precoAtual = state.precosFornecedores.find(
                      p => p.materia_id === item.materia_id && p.fornecedor_id === item.fornecedor_id
                    )?.preco || 0;
                    const precoOriginal = itemOriginal ? (state.precosFornecedores.find(
                      p => p.materia_id === itemOriginal.materia_id && p.fornecedor_id === itemOriginal.fornecedor_id
                    )?.preco || 0) : 0;
                    const economia = (precoOriginal - precoAtual) * item.quantidade;

                    return (
                      <tr key={item.id} className={item.original ? '' : 'bg-blue-50'}>
                        <td className="px-4 py-3 font-medium">{getMateriaNome(item.materia_id)}</td>
                        <td className="px-4 py-3 text-right">{item.quantidade}</td>
                        <td className="px-4 py-3">
                          {itemOriginal ? getFornecedorNome(itemOriginal.fornecedor_id) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.fornecedor_id}
                            onChange={(e) => alterarFornecedor(item.id, Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {fornecedoresDisponiveis.map(fornecedor => (
                              <option key={fornecedor.id} value={fornecedor.id}>
                                {fornecedor.nome} - {formatCurrency(fornecedor.preco)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(precoAtual)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(precoAtual * item.quantidade)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          economia > 0 ? 'text-green-600' : economia < 0 ? 'text-red-600' : ''
                        }`}>
                          {economia !== 0 && (
                            <>
                              {economia > 0 ? '-' : '+'}
                              {formatCurrency(Math.abs(economia))}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Estado inicial */}
      {!selectedProdutoId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Simulador de Custos</p>
          <p className="text-gray-400">Selecione um produto para começar a simulação</p>
        </div>
      )}
    </div>
  );
};

export default Simulacoes;