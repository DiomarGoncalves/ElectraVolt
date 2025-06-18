import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Save, ArrowLeft, Plus, Trash2, AlertTriangle, 
  Package, Factory, HelpCircle 
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Material {
  id: number;
  name: string;
  unit: string;
  price: number;
  stock: number;
}

interface CompositionItem {
  material_id: number;
  material_name?: string;
  material_unit?: string;
  quantity: number;
  cost?: number;
}

interface ProductFormData {
  name: string;
  code: string;
  description: string;
  type: 'resale' | 'manufactured';
  category_id: number;
  selling_price: number;
  cost: number;
  stock: number;
  composition: CompositionItem[];
}

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    description: '',
    type: 'resale',
    category_id: 0,
    selling_price: 0,
    cost: 0,
    stock: 0,
    composition: []
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profitMargin, setProfitMargin] = useState(0);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    const fetchMaterials = async () => {
      try {
        const response = await api.get('/materials');
        setMaterials(response.data);
      } catch (err) {
        console.error('Error fetching materials:', err);
      }
    };
    
    fetchCategories();
    fetchMaterials();
    
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/products/${id}`);
          setFormData(response.data);
          calculateProfitMargin(response.data.selling_price, response.data.cost);
        } catch (err) {
          setError('Erro ao carregar dados do produto');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [id, isEditing]);
  
  // Remover mock data for development
  // const mockCategories: Category[] = [
  //   { id: 1, name: 'Móveis' },
  //   { id: 2, name: 'Iluminação' },
  //   { id: 3, name: 'Decoração' },
  //   { id: 4, name: 'Escritório' }
  // ];
  
  // const mockMaterials: Material[] = [
  //   { id: 1, name: 'Madeira MDF', unit: 'm²', price: 45.00, stock: 50 },
  //   { id: 2, name: 'Parafuso 10mm', unit: 'un', price: 0.25, stock: 500 },
  //   { id: 3, name: 'Tinta Branca', unit: 'L', price: 28.90, stock: 20 },
  //   { id: 4, name: 'Dobradiça', unit: 'un', price: 5.50, stock: 100 },
  //   { id: 5, name: 'Puxador Metálico', unit: 'un', price: 12.80, stock: 45 }
  // ];
  
  const categoriesData = categories;
  const materialsData = materials;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type' && value === 'resale') {
      // Reset composition when changing to resale type
      setFormData({
        ...formData,
        [name]: value,
        composition: []
      });
    } else if (name === 'selling_price' || name === 'cost') {
      const numValue = parseFloat(value) || 0;
      setFormData({
        ...formData,
        [name]: numValue
      });
      
      if (name === 'selling_price') {
        calculateProfitMargin(numValue, formData.cost);
      } else {
        calculateProfitMargin(formData.selling_price, numValue);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const calculateProfitMargin = (sellingPrice: number, cost: number) => {
    if (sellingPrice > 0 && cost > 0) {
      const margin = ((sellingPrice - cost) / sellingPrice) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(0);
    }
  };
  
  const calculateTotalCost = () => {
    if (formData.type === 'manufactured' && formData.composition.length > 0) {
      let totalCost = 0;
      
      formData.composition.forEach(item => {
        const material = materialsData.find(m => m.id === item.material_id);
        if (material) {
          totalCost += material.price * item.quantity;
        }
      });
      
      return totalCost;
    }
    
    return formData.cost;
  };
  
  const handleAddCompositionItem = () => {
    setFormData({
      ...formData,
      composition: [
        ...formData.composition,
        { material_id: 0, quantity: 1 }
      ]
    });
  };
  
  const handleRemoveCompositionItem = (index: number) => {
    const newComposition = [...formData.composition];
    newComposition.splice(index, 1);
    
    setFormData({
      ...formData,
      composition: newComposition
    });
  };
  
  const handleCompositionChange = (index: number, field: string, value: any) => {
    const newComposition = [...formData.composition];
    
    if (field === 'material_id') {
      const materialId = parseInt(value);
      const material = materialsData.find(m => m.id === materialId);
      
      newComposition[index] = {
        ...newComposition[index],
        material_id: materialId,
        material_name: material?.name,
        material_unit: material?.unit
      };
    } else if (field === 'quantity') {
      newComposition[index] = {
        ...newComposition[index],
        quantity: parseFloat(value) || 0
      };
    }
    
    setFormData({
      ...formData,
      composition: newComposition,
      cost: formData.type === 'manufactured' ? calculateTotalCost() : formData.cost
    });
    
    // Recalculate profit margin
    calculateProfitMargin(formData.selling_price, calculateTotalCost());
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || formData.category_id === 0) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    if (formData.type === 'manufactured' && formData.composition.length === 0) {
      setError('Produtos de fabricação própria precisam ter pelo menos um item na composição');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate final cost for manufactured products
      const finalData = {
        ...formData,
        cost: formData.type === 'manufactured' ? calculateTotalCost() : formData.cost
      };
      
      if (isEditing) {
        await api.put(`/products/${id}`, finalData);
      } else {
        await api.post('/products', finalData);
      }
      
      navigate('/products');
    } catch (err) {
      setError('Erro ao salvar produto');
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
            to="/products"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
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
              <div className="sm:col-span-3">
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
              
              <div className="sm:col-span-3">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="code"
                    id="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de Produto *
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="resale">Revenda</option>
                    <option value="manufactured">Fabricação Própria</option>
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
              
              <div className="sm:col-span-2">
                <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
                  Preço de Venda *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="selling_price"
                    id="selling_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Custo {formData.type === 'manufactured' ? '(Calculado)' : '*'}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="cost"
                    id="cost"
                    required
                    min="0"
                    step="0.01"
                    value={formData.type === 'manufactured' ? calculateTotalCost() : formData.cost}
                    onChange={handleInputChange}
                    disabled={formData.type === 'manufactured'}
                    className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md ${
                      formData.type === 'manufactured' ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Margem de Lucro
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={`${profitMargin.toFixed(2)}%`}
                    className="bg-gray-100 focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className={`text-sm ${
                      profitMargin >= 40 ? 'text-green-600' : 
                      profitMargin >= 20 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {profitMargin >= 40 ? 'Ótima' : 
                       profitMargin >= 20 ? 'Média' : 
                       'Baixa'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="sm:col-span-2">
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
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {formData.type === 'manufactured' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Composição do Produto
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Adicione os materiais utilizados na fabricação deste produto
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCompositionItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Material
              </button>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {formData.composition.length === 0 ? (
                <div className="text-center py-4">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum material adicionado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione materiais para calcular o custo de fabricação.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.composition.map((item, index) => {
                    const material = materialsData.find(m => m.id === item.material_id);
                    const itemCost = material ? Number(material.price) * item.quantity : 0;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <select
                            value={item.material_id}
                            onChange={(e) => handleCompositionChange(index, 'material_id', e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Selecione um material</option>
                            {materialsData.map((material2) => (
                              <option key={material2.id} value={material2.id}>
                                {material2.name} (R$ {Number(material2.price).toFixed(2)} / {material2.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-32">
                          <div className="flex rounded-md shadow-sm">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleCompositionChange(index, 'quantity', e.target.value)}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-l-md"
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                              {material?.unit || 'un'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-32 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            R$ {itemCost.toFixed(2)}
                          </span>
                        </div>
                        
                        <div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompositionItem(index)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Custo Total</p>
                      <p className="text-lg font-medium text-gray-900">
                        R$ {calculateTotalCost().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductForm;