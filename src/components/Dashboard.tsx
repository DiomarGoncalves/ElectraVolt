import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Package, Building2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { calcularCustoProduto, formatCurrency } from '../utils/calculations';

const Dashboard: React.FC = () => {
  const { state } = useApp();

  // Estatísticas gerais
  const totalFornecedores = state.fornecedores.length;
  const totalMaterias = state.materiasPrimas.length;
  const totalProdutos = state.produtos.length;
  const totalPrecos = state.precosFornecedores.length;

  // Calcular valor médio dos produtos
  const precoMedioProdutos = state.produtos.length > 0 
    ? state.produtos.reduce((acc, produto) => acc + produto.preco_venda, 0) / state.produtos.length
    : 0;

  // Verificar matérias com estoque baixo
  const materiasEstoqueBaixo = state.materiasPrimas.filter(m => m.estoque < 10);

  // Produto com maior margem
  const produtoMaiorMargem = state.produtos.reduce((max, produto) => {
    const calculoAtual = calcularCustoProduto(produto, state);
    const calculoMax = max ? calcularCustoProduto(max, state) : { margemLucro: -1 };
    return calculoAtual.margemLucro > calculoMax.margemLucro ? produto : max;
  }, null as any);

  const stats = [
    {
      label: 'Fornecedores',
      value: totalFornecedores,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      label: 'Matérias-Primas',
      value: totalMaterias,
      icon: Package,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      label: 'Produtos',
      value: totalProdutos,
      icon: Building2,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      label: 'Preço Médio',
      value: formatCurrency(precoMedioProdutos),
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+5%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Loading state */}
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando dados...</span>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Erro: {state.error}</span>
          </div>
        </div>
      )}

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertas */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
          </div>
          <div className="space-y-3">
            {materiasEstoqueBaixo.length > 0 ? (
              materiasEstoqueBaixo.map(materia => (
                <div key={materia.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-800">{materia.nome}</p>
                    <p className="text-sm text-yellow-600">Estoque baixo: {materia.estoque} {materia.unidade}</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum alerta no momento</p>
            )}
          </div>
        </div>

        {/* Produtos recentes */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Recentes</h3>
          <div className="space-y-3">
            {state.produtos.slice(-5).map(produto => {
              const calculo = calcularCustoProduto(produto, state);
              return (
                <div key={produto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{produto.nome}</p>
                    <p className="text-sm text-gray-600">Margem: {formatCurrency(calculo.margemLucro)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(calculo.precoVenda)}</p>
                    <p className="text-sm text-green-600">+{formatCurrency(calculo.lucroAbsoluto)}</p>
                  </div>
                </div>
              );
            })}
            {state.produtos.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum produto cadastrado</p>
            )}
          </div>
        </div>
      </div>

      {/* Resumo de desempenho */}
      {produtoMaiorMargem && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Produto Mais Rentável</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{produtoMaiorMargem.nome}</p>
              <p className="text-green-100">Margem de {calcularCustoProduto(produtoMaiorMargem, state).margemLucro.toFixed(2)}%</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(calcularCustoProduto(produtoMaiorMargem, state).precoVenda)}
              </p>
              <p className="text-green-100">Preço de venda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;