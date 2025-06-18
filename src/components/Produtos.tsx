import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Building2, Calculator, Eye } from 'lucide-react';
import { Produto, ComposicaoItem } from '../types';
import { calcularCustoProduto, formatCurrency } from '../utils/calculations';

const Produtos: React.FC = () => {
  const { state, actions } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    preco_venda: 0,
  });
  const [composicao, setComposicao] = useState<Omit<ComposicaoItem, 'id'>[]>([]);

  const resetForm = () => {
    setFormData({
      nome: '',
      preco_venda: 0,
    });
    setComposicao([]);
    setEditingProduto(null);
  };

  const addComposicaoItem = () => {
    const newItem: Omit<ComposicaoItem, 'id'> = {
      materia_id: 0,
      quantidade: 1,
      fornecedor_id: 0,
    };
    setComposicao([...composicao, newItem]);
  };

  const updateComposicaoItem = (index: number, field: keyof Omit<ComposicaoItem, 'id'>, value: any) => {
    setComposicao(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeComposicaoItem = (index: number) => {
    setComposicao(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (composicao.length === 0) {
      alert('Adicione pelo menos um item à composição do produto');
      return;
    }

    const invalidItems = composicao.filter(item => 
      !item.materia_id || !item.fornecedor_id || item.quantidade <= 0
    );

    if (invalidItems.length > 0) {
      alert('Preencha todos os campos da composição');
      return;
    }

    try {
      if (editingProduto) {
        await actions.updateProduto(editingProduto.id, {
          ...formData,
          composicao,
        });
      } else {
        await actions.createProduto({
          ...formData,
          composicao,
        });
      }
      
      setShowModal(false);
      resetForm();
      await actions.loadProdutos();
    } catch (error) {
      alert('Erro ao salvar produto');
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      preco_venda: produto.preco_venda,
    });
    setComposicao(
      Array.isArray(produto.composicao)
        ? produto.composicao.map(item => ({
            materia_id: item.materia_id,
            fornecedor_id: item.fornecedor_id,
            quantidade: item.quantidade,
          }))
        : []
    );
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await actions.deleteProduto(id);
        await actions.loadProdutos();
      } catch (error) {
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleViewDetails = (produto: Produto) => {
    setSelectedProduto(produto);
    setShowDetailsModal(true);
  };

  const getMateriaNome = (materiaId: number) => {
    const materia = state.materiasPrimas.find(m => m.id === materiaId);
    return materia?.nome || 'Material não encontrado';
  };

  const getFornecedorNome = (fornecedorId: number) => {
    const fornecedor = state.fornecedores.find(f => f.id === fornecedorId);
    return fornecedor?.nome || 'Fornecedor não encontrado';
  };

  const getFornecedoresByMateria = (materiaId: number) => {
    const precos = state.precosFornecedores.filter(p => p.materia_id === materiaId);
    return precos.map(p => ({
      fornecedorId: p.fornecedor_id,
      nome: getFornecedorNome(p.fornecedor_id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
          <p className="text-gray-600 mt-1">Monte produtos definindo preço de venda e composição</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Produtos Cadastrados ({state.produtos.length})
          </h3>
        </div>
        
        {state.produtos.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {state.produtos.map((produto) => {
              const calculo = calcularCustoProduto(produto, state);
              
              return (
                <div key={produto.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">{produto.nome}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Custo Total:</span>
                          <span className="ml-1 font-medium text-red-600">
                            {formatCurrency(calculo.custoTotal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Preço Venda:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {formatCurrency(calculo.precoVenda)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Margem:</span>
                          <span className="ml-1 font-medium">{calculo.margemLucro.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Lucro:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {formatCurrency(calculo.lucroAbsoluto)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span>{Array.isArray(produto.composicao) ? produto.composicao.length : 0} itens na composição</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(produto)}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(produto)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(produto.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Nenhum produto cadastrado</p>
            <p className="text-gray-400">Adicione o primeiro produto para começar</p>
          </div>
        )}
      </div>

      {/* Modal Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 my-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingProduto ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.preco_venda}
                    onChange={(e) => setFormData(prev => ({ ...prev, preco_venda: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Composição */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Composição do Produto</h4>
                  <button
                    type="button"
                    onClick={addComposicaoItem}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Adicionar Item
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {composicao.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={item.materia_id}
                          onChange={(e) => {
                            updateComposicaoItem(index, 'materia_id', Number(e.target.value));
                            updateComposicaoItem(index, 'fornecedor_id', 0);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Selecione a matéria-prima</option>
                          {state.materiasPrimas.map(materia => (
                            <option key={materia.id} value={materia.id}>
                              {materia.nome} ({materia.unidade})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-20">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Qtd"
                          value={item.quantidade}
                          onChange={(e) => updateComposicaoItem(index, 'quantidade', Number(e.target.value))}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <select
                          value={item.fornecedor_id}
                          onChange={(e) => updateComposicaoItem(index, 'fornecedor_id', Number(e.target.value))}
                          disabled={!item.materia_id}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value={0}>Selecione o fornecedor</option>
                          {item.materia_id && getFornecedoresByMateria(item.materia_id).map(fornecedor => (
                            <option key={fornecedor.fornecedorId} value={fornecedor.fornecedorId}>
                              {fornecedor.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeComposicaoItem(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {composicao.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum item adicionado à composição
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduto ? 'Salvar' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetailsModal && selectedProduto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalhes do Produto: {selectedProduto.nome}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {(() => {
              const calculo = calcularCustoProduto(selectedProduto, state);
              return (
                <div className="space-y-6">
                  {/* Resumo Financeiro */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800">Custo Total</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(calculo.custoTotal)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800">Preço de Venda</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculo.precoVenda)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Breakdown de Custos */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Composição de Custos</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Material</th>
                            <th className="px-4 py-2 text-right">Qtd</th>
                            <th className="px-4 py-2 text-left">Fornecedor</th>
                            <th className="px-4 py-2 text-right">Preço Unit.</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {calculo.breakdown.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 font-medium">{item.nome}</td>
                              <td className="px-4 py-2 text-right">{item.quantidade}</td>
                              <td className="px-4 py-2">{item.fornecedor}</td>
                              <td className="px-4 py-2 text-right">{formatCurrency(item.precoUnitario)}</td>
                              <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.custoTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                          <tr className="text-lg">
                            <td colSpan={4} className="px-4 py-2">TOTAL CUSTO:</td>
                            <td className="px-4 py-2 text-right text-red-600">{formatCurrency(calculo.custoTotal)}</td>
                          </tr>
                          <tr className="text-lg">
                            <td colSpan={4} className="px-4 py-2">Margem ({calculo.margemLucro.toFixed(2)}%):</td>
                            <td className="px-4 py-2 text-right text-green-600">+{formatCurrency(calculo.lucroAbsoluto)}</td>
                          </tr>
                          <tr className="text-xl bg-blue-50">
                            <td colSpan={4} className="px-4 py-2 text-blue-800">PREÇO VENDA:</td>
                            <td className="px-4 py-2 text-right text-blue-800">{formatCurrency(calculo.precoVenda)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;