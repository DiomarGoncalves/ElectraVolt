import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Package, DollarSign, Users } from 'lucide-react';
import { MateriaPrima, PrecoFornecedor } from '../types';
import { gerarId, formatCurrency } from '../utils/calculations';

const MateriasPrimas: React.FC = () => {
  const { state, actions } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingMateria, setEditingMateria] = useState<MateriaPrima | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    unidade: '',
    estoque: 0,
    descricao: '',
  });
  const [priceFormData, setPriceFormData] = useState({
    fornecedorId: '',
    preco: 0,
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      unidade: '',
      estoque: 0,
      descricao: '',
    });
    setEditingMateria(null);
  };

  const resetPriceForm = () => {
    setPriceFormData({
      fornecedorId: '',
      preco: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      
      if (editingMateria) {
        await actions.updateMateriaPrima(editingMateria.id, {
          ...formData,
          updatedAt: now,
        });
      } else {
        await actions.createMateriaPrima({
          id: gerarId(),
          ...formData,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      setShowModal(false);
      resetForm();
      await actions.loadMateriasPrimas();
    } catch (error) {
      alert('Erro ao salvar matéria-prima');
    }
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMateria) return;

    try {
      await actions.createOrUpdatePreco({
        fornecedor_id: Number(priceFormData.fornecedorId),
        materia_id: Number(selectedMateria),
        preco: Number(priceFormData.preco),
      });

      setShowPriceModal(false);
      resetPriceForm();
      setSelectedMateria(null);
      await actions.loadPrecos();
    } catch (error) {
      alert('Erro ao salvar preço do fornecedor');
    }
  };

  const handleEdit = (materia: MateriaPrima) => {
    setEditingMateria(materia);
    setFormData({
      nome: materia.nome,
      unidade: materia.unidade,
      estoque: materia.estoque,
      descricao: materia.descricao,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria-prima?')) {
      try {
        await actions.deleteMateriaPrima(id);
        await actions.loadMateriasPrimas();
      } catch (error) {
        alert('Erro ao excluir matéria-prima');
      }
    }
  };

  const handleManagePrices = (materiaId: string) => {
    setSelectedMateria(materiaId);
    setShowPriceModal(true);
  };

  const getPrecosByMateria = (materiaId: string) => {
    return state.precosFornecedores.filter(
      p => String(p.materia_id) === String(materiaId)
    );
  };

  const getFornecedorNome = (fornecedor_id: number) => {
    const fornecedor = state.fornecedores.find(f => f.id === fornecedor_id);
    return fornecedor?.nome || 'Fornecedor não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Matérias-Primas</h2>
          <p className="text-gray-600 mt-1">Gerencie os componentes e seus preços por fornecedor</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Matéria-Prima
        </button>
      </div>

      {/* Lista de Matérias-Primas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Componentes Cadastrados ({state.materiasPrimas.length})
          </h3>
        </div>
        
        {state.materiasPrimas.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {state.materiasPrimas.map((materia) => {
              const precos = getPrecosByMateria(materia.id);
              const precoMedio = precos.length > 0 
                ? precos.reduce((acc, p) => acc + Number(p.preco), 0) / precos.length 
                : 0;
              
              return (
                <div key={materia.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Package className="h-5 w-5 text-gray-400 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">{materia.nome}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Unidade:</span>
                          <span className="ml-1 font-medium">{materia.unidade}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Estoque:</span>
                          <span className={`ml-1 font-medium ${
                            materia.estoque < 10 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {materia.estoque}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fornecedores:</span>
                          <span className="ml-1 font-medium">{precos.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Preço Médio:</span>
                          <span className="ml-1 font-medium">
                            {precos.length > 0 ? formatCurrency(precoMedio) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {materia.descricao && (
                        <p className="text-gray-600 text-sm">{materia.descricao}</p>
                      )}
                      
                      {/* Preços por fornecedor */}
                      {precos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {precos.map(preco => (
                              <div key={preco.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                <span className="font-medium">{getFornecedorNome(preco.fornecedor_id)}</span>
                                <span className="ml-2">{formatCurrency(preco.preco)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleManagePrices(materia.id)}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        title="Gerenciar Preços"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(materia)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(materia.id)}
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
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Nenhuma matéria-prima cadastrada</p>
            <p className="text-gray-400">Adicione o primeiro componente para começar</p>
          </div>
        )}
      </div>

      {/* Modal Matéria-Prima */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingMateria ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Componente *
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
                  Unidade de Medida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex.: un, kg, m, l"
                  value={formData.unidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingMateria ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preços */}
      {showPriceModal && selectedMateria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Gerenciar Preços - {state.materiasPrimas.find(m => m.id === selectedMateria)?.nome}
            </h3>
            
            {/* Lista de preços existentes */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preços Atuais</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getPrecosByMateria(selectedMateria).map(preco => (
                  <div key={preco.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{getFornecedorNome(preco.fornecedor_id)}</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(preco.preco)}</span>
                  </div>
                ))}
                {getPrecosByMateria(selectedMateria).length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhum preço cadastrado</p>
                )}
              </div>
            </div>
            
            {/* Formulário para adicionar/editar preço */}
            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor *
                </label>
                <select
                  required
                  value={priceFormData.fornecedorId}
                  onChange={(e) => setPriceFormData(prev => ({ ...prev, fornecedorId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um fornecedor</option>
                  {state.fornecedores.map(fornecedor => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={priceFormData.preco}
                  onChange={(e) => setPriceFormData(prev => ({ ...prev, preco: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriceModal(false);
                    resetPriceForm();
                    setSelectedMateria(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salvar Preço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriasPrimas;