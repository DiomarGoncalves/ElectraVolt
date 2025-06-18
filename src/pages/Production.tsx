import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, AlertTriangle, Check, X, Package, 
  Calendar, Clock, ArrowUp, ArrowDown, Filter, Search 
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  code: string;
  type: 'manufactured';
  composition: Array<{
    material_id: number;
    material_name: string;
    material_unit: string;
    quantity: number;
  }>;
}

interface Material {
  id: number;
  name: string;
  unit: string;
  stock: number;
}

interface ProductionRecord {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  production_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
}

const Production: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [sortField, setSortField] = useState<keyof ProductionRecord>('production_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch manufactured products
        const productsResponse = await api.get('/products?type=manufactured');
        setProducts(productsResponse.data);
        
        // Fetch materials for stock checking
        const materialsResponse = await api.get('/materials');
        setMaterials(materialsResponse.data);
        
        // Fetch production records
        const productionResponse = await api.get('/production');
        setProductionRecords(productionResponse.data);
      } catch (err) {
        setError('Erro ao carregar dados de produção');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const productsData = products;
  const materialsData = materials;
  const productionData = productionRecords;
  
  const handleSort = (field: keyof ProductionRecord) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredProduction = productionData
    .filter(record => 
      (filterStatus === 'all' || record.status === filterStatus) &&
      record.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === 'production_date') {
        return sortDirection === 'asc' 
          ? new Date(a.production_date).getTime() - new Date(b.production_date).getTime()
          : new Date(b.production_date).getTime() - new Date(a.production_date).getTime();
      }
      
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  
  const checkMaterialAvailability = (productId: number, quantity: number) => {
    const product = productsData.find(p => p.id === productId);
    if (!product) return [];
    
    const insufficientMaterials = [];
    
    for (const item of product.composition) {
      const material = materialsData.find(m => m.id === item.material_id);
      if (material) {
        const requiredAmount = item.quantity * quantity;
        if (material.stock < requiredAmount) {
          insufficientMaterials.push({
            name: material.name,
            required: requiredAmount,
            available: material.stock,
            unit: material.unit
          });
        }
      }
    }
    
    return insufficientMaterials;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || quantity <= 0) {
      setError('Por favor, selecione um produto e uma quantidade válida');
      return;
    }
    
    const insufficientMaterials = checkMaterialAvailability(selectedProduct, quantity);
    
    if (insufficientMaterials.length > 0) {
      setError(`Materiais insuficientes para produção: ${insufficientMaterials.map(m => 
        `${m.name} (necessário: ${m.required} ${m.unit}, disponível: ${m.available} ${m.unit})`
      ).join(', ')}`);
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // await api.post('/production', {
      //   product_id: selectedProduct,
      //   quantity,
      //   notes
      // });
      
      // Mock response for development
      const product = productsData.find(p => p.id === selectedProduct);
      const newRecord: ProductionRecord = {
        id: productionData.length + 1,
        product_id: selectedProduct,
        product_name: product?.name || '',
        quantity,
        production_date: new Date().toISOString(),
        status: 'pending',
        notes
      };
      
      setProductionRecords([newRecord, ...productionData]);
      
      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setNotes('');
      setShowForm(false);
      setError('');
    } catch (err) {
      setError('Erro ao registrar produção');
      console.error(err);
    }
  };
  
  const handleStatusChange = async (id: number, status: 'completed' | 'cancelled') => {
    try {
      // In a real app, this would be an API call
      // await api.put(`/production/${id}`, { status });
      
      // Mock update for development
      const updatedRecords = productionData.map(record => 
        record.id === id ? { ...record, status } : record
      );
      
      setProductionRecords(updatedRecords);
    } catch (err) {
      setError('Erro ao atualizar status da produção');
      console.error(err);
    }
  };
  
  const getMaxProduction = (productId: number) => {
    const product = productsData.find(p => p.id === productId);
    if (!product) return 0;
    
    let maxProduction = Infinity;
    
    for (const item of product.composition) {
      const material = materialsData.find(m => m.id === item.material_id);
      if (material) {
        const possibleProduction = Math.floor(material.stock / item.quantity);
        maxProduction = Math.min(maxProduction, possibleProduction);
      }
    }
    
    return maxProduction === Infinity ? 0 : maxProduction;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Produção</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? (
            <>
              <X size={16} className="mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Nova Produção
            </>
          )}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registrar Nova Produção
            </h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                  Produto *
                </label>
                <select
                  id="product"
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(parseInt(e.target.value) || null)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {productsData.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedProduct && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Composição do Produto</h4>
                  <ul className="space-y-2">
                    {productsData.find(p => p.id === selectedProduct)?.composition.map((item, index) => {
                      const material = materialsData.find(m => m.id === item.material_id);
                      const requiredAmount = item.quantity * quantity;
                      const isAvailable = material && material.stock >= requiredAmount;
                      
                      return (
                        <li key={index} className="flex justify-between text-sm">
                          <span>{item.material_name}</span>
                          <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {requiredAmount} {item.material_unit} 
                            {material && ` (disponível: ${material.stock} ${material.unit})`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className="mt-3 text-sm text-blue-800">
                    <span className="font-medium">Produção máxima possível:</span> {getMaxProduction(selectedProduct)} unidades
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantidade *
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Registrar Produção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'completed' | 'cancelled')}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center">
                    Produto
                    {sortField === 'product_name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Quantidade
                    {sortField === 'quantity' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('production_date')}
                >
                  <div className="flex items-center">
                    Data
                    {sortField === 'production_date' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observações
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProduction.length > 0 ? (
                filteredProduction.map((record) => {
                  const date = new Date(record.production_date);
                  const formattedDate = date.toLocaleDateString('pt-BR');
                  const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <Package size={16} className="mr-2 text-gray-400" />
                          {record.product_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.quantity} unidades
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            {formattedDate}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock size={14} className="mr-1 text-gray-400" />
                            {formattedTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status === 'completed' ? 'Concluído' : 
                           record.status === 'pending' ? 'Pendente' : 
                           'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {record.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {record.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleStatusChange(record.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como concluído"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(record.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar produção"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum registro de produção encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Production;