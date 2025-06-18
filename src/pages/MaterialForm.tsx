import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface MaterialFormData {
  name: string;
  unit: string;
  price: number;
  stock: number;
  category_id: number;
  min_stock: number;
}

const MaterialForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    unit: '',
    price: 0,
    stock: 0,
    category_id: 0,
    min_stock: 0
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
    
    if (isEditing) {
      const fetchMaterial = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/materials/${id}`);
          setFormData(response.data);
        } catch (err) {
          setError('Erro ao carregar dados da matéria-prima');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchMaterial();
    }
  }, [id, isEditing]);
  
  // Remover mock data for development
  // const mockCategories: Category[] = [ ... ];

  const categoriesData = categories;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'stock' || name === 'min_stock') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unit || formData.category_id === 0) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing) {
        await api.put(`/materials/${id}`, formData);
      } else {
        await api.post('/materials', formData);
      }
      
      navigate('/materials');
    } catch (err) {
      setError('Erro ao salvar matéria-prima');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/materials"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? (
            <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
          ) : (
            <Save size={16} className="mr-2" />
          )}
          Salvar
        </button>
      </div>
      
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
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unidade de Medida *
                </label>
                <div className="mt-1">
                  <select
                    id="unit"
                    name="unit"
                    required
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Selecione</option>
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="m">Metro (m)</option>
                    <option value="m²">Metro Quadrado (m²)</option>
                    <option value="m³">Metro Cúbico (m³)</option>
                    <option value="L">Litro (L)</option>
                    <option value="mL">Mililitro (mL)</option>
                    <option value="pç">Peça (pç)</option>
                    <option value="cx">Caixa (cx)</option>
                    <option value="par">Par (par)</option>
                    <option value="conj">Conjunto (conj)</option>
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Categoria *
                </label>
                <div className="mt-1">
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriesData.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Preço por Unidade *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Estoque Atual *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="stock"
                    id="stock"
                    required
                    min="0"
                    step="0.01"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700">
                  Estoque Mínimo *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="min_stock"
                    id="min_stock"
                    required
                    min="0"
                    step="0.01"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Quando o estoque ficar abaixo deste valor, o sistema enviará alertas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaterialForm;