import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, FileText, Download, Filter } from 'lucide-react';
import { calcularCustoProduto, formatCurrency, formatPercentage } from '../utils/calculations';

const Relatorios: React.FC = () => {
  const { state } = useApp();
  const [activeReport, setActiveReport] = useState<'produtos' | 'fornecedores' | 'materias' | 'comparativo'>('produtos');

  // Relatório de Produtos com Custos
  const relatorioProdutos = state.produtos.map(produto => {
    const calculo = calcularCustoProduto(produto, state);
    return {
      produto,
      calculo,
    };
  }).sort((a, b) => b.produto.preco_venda - a.produto.preco_venda);

  // Relatório de Fornecedores
  const relatorioFornecedores = state.fornecedores.map(fornecedor => {
    const precos = state.precosFornecedores.filter(p => p.fornecedor_id === fornecedor.id);
    const precoMedio = precos.length > 0 
      ? precos.reduce((acc, p) => acc + Number(p.preco), 0) / precos.length 
      : 0;
    
    // Contar quantos produtos usam este fornecedor
    const produtosQueUsam = state.produtos.filter(produto =>
      Array.isArray(produto.composicao) && produto.composicao.some(item => item.fornecedor_id === fornecedor.id)
    ).length;

    return {
      fornecedor,
      totalItens: precos.length,
      precoMedio,
      produtosQueUsam,
    };
  }).sort((a, b) => b.totalItens - a.totalItens);

  // Relatório de Matérias-Primas
  const relatorioMaterias = state.materiasPrimas.map(materia => {
    const precos = state.precosFornecedores.filter(p => p.materia_id === materia.id);
    const precoMedio = precos.length > 0 
      ? precos.reduce((acc, p) => acc + Number(p.preco), 0) / precos.length 
      : 0;
    const precoMinimo = precos.length > 0 ? Math.min(...precos.map(p => Number(p.preco))) : 0;
    const precoMaximo = precos.length > 0 ? Math.max(...precos.map(p => Number(p.preco))) : 0;
    
    // Verificar em quantos produtos esta matéria é usada
    const usadoEmProdutos = state.produtos.filter(produto =>
      Array.isArray(produto.composicao) && produto.composicao.some(item => item.materia_id === materia.id)
    ).length;

    return {
      materia,
      fornecedores: precos.length,
      precoMedio,
      precoMinimo,
      precoMaximo,
      usadoEmProdutos,
      statusEstoque: materia.estoque < 10 ? 'Baixo' : materia.estoque < 50 ? 'Médio' : 'Alto',
    };
  }).sort((a, b) => b.usadoEmProdutos - a.usadoEmProdutos);

  // Comparativo de fornecedores por matéria-prima
  const comparativoFornecedores = state.materiasPrimas.map(materia => {
    const precos = state.precosFornecedores
      .filter(p => p.materia_id === materia.id)
      .map(preco => {
        const fornecedor = state.fornecedores.find(f => f.id === preco.fornecedor_id);
        return {
          fornecedor: fornecedor?.nome || 'N/A',
          preco: Number(preco.preco),
        };
      })
      .sort((a, b) => a.preco - b.preco);

    return {
      materia: materia.nome,
      precos,
      economia: precos.length > 1 ? precos[precos.length - 1].preco - precos[0].preco : 0,
    };
  }).filter(item => item.precos.length > 1);

  // Função utilitária para exportar CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert('Nada para exportar!');
      return;
    }
    const replacer = (_key: string, value: any) => (value === null || value === undefined ? '' : value);
    const header = Object.keys(data[0]);
    const csv = [
      header.join(';'),
      ...data.map(row =>
        header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';')
      ),
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reports = [
    { id: 'produtos', label: 'Produtos e Custos', icon: BarChart3 },
    { id: 'fornecedores', label: 'Fornecedores', icon: FileText },
    { id: 'materias', label: 'Matérias-Primas', icon: FileText },
    { id: 'comparativo', label: 'Comparativo de Preços', icon: Filter },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-600 mt-1">Análises detalhadas dos custos e fornecedores</p>
        </div>
      </div>

      {/* Navegação dos Relatórios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id as any)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeReport === report.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {report.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Relatório de Produtos */}
          {activeReport === 'produtos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Relatório de Produtos e Custos</h3>
                <button
                  onClick={() => exportToCSV(
                    relatorioProdutos.map(({ produto, calculo }) => ({
                      Produto: produto.nome,
                      'Custo Materiais': calculo.custoMateriais,
                      'Custos Adicionais': (produto.custosAdicionais?.maoDeObra || 0) + (produto.custosAdicionais?.operacionais || 0) + (produto.custosAdicionais?.embalagem || 0),
                      'Custo Total': calculo.custoTotal,
                      Margem: calculo.margemLucro,
                      'Preço Venda': produto.preco_venda,
                      Lucro: calculo.lucroAbsoluto,
                      'Itens Composição': Array.isArray(produto.composicao) ? produto.composicao.length : 0,
                    })),
                    'produtos-custos.csv'
                  )}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Produto</th>
                      <th className="px-4 py-3 text-right">Custo Materiais</th>
                      <th className="px-4 py-3 text-right">Custos Adicionais</th>
                      <th className="px-4 py-3 text-right">Custo Total</th>
                      <th className="px-4 py-3 text-right">Margem</th>
                      <th className="px-4 py-3 text-right">Preço Venda</th>
                      <th className="px-4 py-3 text-right">Lucro</th>
                      <th className="px-4 py-3 text-center">Itens Composição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorioProdutos.map(({ produto, calculo }) => {
                      // Garante que custosAdicionais existe e tem os campos necessários
                      const custosAdicionais = produto.custosAdicionais ?? { maoDeObra: 0, operacionais: 0, embalagem: 0 };
                      const custosAdicionaisTotal = 
                        (custosAdicionais.maoDeObra || 0) + 
                        (custosAdicionais.operacionais || 0) + 
                        (custosAdicionais.embalagem || 0);

                      return (
                        <tr key={produto.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{produto.nome}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(calculo.custoMateriais)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(custosAdicionaisTotal)}</td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            {formatCurrency(calculo.custoTotal)}
                          </td>
                          <td className="px-4 py-3 text-right">{formatPercentage(produto.margem)}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {formatCurrency(calculo.precoVenda)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {formatCurrency(calculo.lucroAbsoluto)}
                          </td>
                          <td className="px-4 py-3 text-center">{produto.composicao.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-4 py-3">TOTAL ({relatorioProdutos.length} produtos)</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(relatorioProdutos.reduce((acc, item) => acc + item.calculo.custoMateriais, 0))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(relatorioProdutos.reduce((acc, item) => {
                          const custosAdicionais = item.produto.custosAdicionais ?? { maoDeObra: 0, operacionais: 0, embalagem: 0 };
                          return acc + (custosAdicionais.maoDeObra || 0) + (custosAdicionais.operacionais || 0) + (custosAdicionais.embalagem || 0);
                        }, 0))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(relatorioProdutos.reduce((acc, item) => acc + item.calculo.custoTotal, 0))}
                      </td>
                      <td className="px-4 py-3 text-right">-</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(relatorioProdutos.reduce((acc, item) => acc + (typeof item.produto.preco_venda === 'number' ? item.produto.preco_venda : 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(relatorioProdutos.reduce((acc, item) => acc + item.calculo.lucroAbsoluto, 0))}
                      </td>
                      <td className="px-4 py-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Relatório de Fornecedores */}
          {activeReport === 'fornecedores' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Relatório de Fornecedores</h3>
                <button
                  onClick={() => exportToCSV(
                    relatorioFornecedores.map(({ fornecedor, totalItens, precoMedio, produtosQueUsam }) => ({
                      Fornecedor: fornecedor.nome,
                      CNPJ: fornecedor.cnpj,
                      Telefone: fornecedor.telefone,
                      Email: fornecedor.email,
                      'Itens Cadastrados': totalItens,
                      'Preço Médio': precoMedio,
                      'Produtos que Usam': produtosQueUsam,
                    })),
                    'fornecedores.csv'
                  )}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Fornecedor</th>
                      <th className="px-4 py-3 text-left">CNPJ</th>
                      <th className="px-4 py-3 text-left">Contato</th>
                      <th className="px-4 py-3 text-right">Itens Cadastrados</th>
                      <th className="px-4 py-3 text-right">Preço Médio</th>
                      <th className="px-4 py-3 text-right">Produtos que Usam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorioFornecedores.map(({ fornecedor, totalItens, precoMedio, produtosQueUsam }) => (
                      <tr key={fornecedor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{fornecedor.nome}</td>
                        <td className="px-4 py-3">{fornecedor.cnpj}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <div>{fornecedor.telefone}</div>
                            <div className="text-gray-500">{fornecedor.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{totalItens}</td>
                        <td className="px-4 py-3 text-right">
                          {totalItens > 0 ? formatCurrency(precoMedio) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">{produtosQueUsam}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Relatório de Matérias-Primas */}
          {activeReport === 'materias' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Relatório de Matérias-Primas</h3>
                <button
                  onClick={() => exportToCSV(
                    relatorioMaterias.map(({ materia, fornecedores, precoMedio, precoMinimo, precoMaximo, usadoEmProdutos, statusEstoque }) => ({
                      Material: materia.nome,
                      Unidade: materia.unidade,
                      Estoque: materia.estoque,
                      Status: statusEstoque,
                      Fornecedores: fornecedores,
                      'Preço Mín.': precoMinimo,
                      'Preço Máx.': precoMaximo,
                      'Preço Médio': precoMedio,
                      'Usado em Produtos': usadoEmProdutos,
                    })),
                    'materias-primas.csv'
                  )}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Material</th>
                      <th className="px-4 py-3 text-center">Unidade</th>
                      <th className="px-4 py-3 text-right">Estoque</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Fornecedores</th>
                      <th className="px-4 py-3 text-right">Preço Mín.</th>
                      <th className="px-4 py-3 text-right">Preço Máx.</th>
                      <th className="px-4 py-3 text-right">Preço Médio</th>
                      <th className="px-4 py-3 text-right">Usado em Produtos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {relatorioMaterias.map(({ 
                      materia, 
                      fornecedores, 
                      precoMedio, 
                      precoMinimo, 
                      precoMaximo, 
                      usadoEmProdutos, 
                      statusEstoque 
                    }) => (
                      <tr key={materia.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{materia.nome}</td>
                        <td className="px-4 py-3 text-center">{materia.unidade}</td>
                        <td className="px-4 py-3 text-right">{materia.estoque}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            statusEstoque === 'Baixo' ? 'bg-red-100 text-red-800' :
                            statusEstoque === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {statusEstoque}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{fornecedores}</td>
                        <td className="px-4 py-3 text-right">
                          {fornecedores > 0 ? formatCurrency(precoMinimo) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {fornecedores > 0 ? formatCurrency(precoMaximo) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {fornecedores > 0 ? formatCurrency(precoMedio) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">{usadoEmProdutos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comparativo de Preços */}
          {activeReport === 'comparativo' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Comparativo de Preços por Fornecedor</h3>
                <button
                  onClick={() => exportToCSV(
                    comparativoFornecedores.map(item => ({
                      Material: item.materia,
                      'Melhor Preço': item.precos[0]?.preco,
                      'Fornecedor Melhor Preço': item.precos[0]?.fornecedor,
                      'Pior Preço': item.precos[item.precos.length - 1]?.preco,
                      'Fornecedor Pior Preço': item.precos[item.precos.length - 1]?.fornecedor,
                      'Economia Máxima': item.economia,
                    })),
                    'comparativo-precos.csv'
                  )}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </button>
              </div>
              
              <div className="space-y-6">
                {comparativoFornecedores.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">{item.materia}</h4>
                      <div className="text-sm">
                        <span className="text-gray-500">Economia máxima: </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(item.economia)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.precos.map((preco, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border-2 ${
                            idx === 0 ? 'border-green-500 bg-green-50' : 
                            idx === item.precos.length - 1 ? 'border-red-500 bg-red-50' : 
                            'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{preco.fornecedor}</span>
                            <span className={`font-bold ${
                              idx === 0 ? 'text-green-600' : 
                              idx === item.precos.length - 1 ? 'text-red-600' : 
                              'text-gray-900'
                            }`}>
                              {formatCurrency(preco.preco)}
                            </span>
                          </div>
                          {idx === 0 && (
                            <div className="text-xs text-green-600 mt-1">Melhor preço</div>
                          )}
                          {idx === item.precos.length - 1 && (
                            <div className="text-xs text-red-600 mt-1">Maior preço</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {comparativoFornecedores.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Nenhuma matéria-prima possui múltiplos fornecedores para comparação
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;