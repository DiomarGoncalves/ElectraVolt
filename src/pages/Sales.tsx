import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, AlertTriangle, Check, X, Package, 
  Calendar, Clock, ArrowUp, ArrowDown, Filter, Search,
  DollarSign, ShoppingCart, Trash2
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  code: string;
  selling_price: number;
  cost: number;
  stock: number;
}

interface SaleRecord {
  id: number;
  date: string;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    cost: number;
  }>;
  total: number;
  profit: number;
  notes: string;
}

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  cost: number;
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'total' | 'profit'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await api.get('/products');
        setProducts(productsResponse.data);
        
        // Fetch sales
        const salesResponse = await api.get('/sales');
        setSales(salesResponse.data);
      } catch (err) {
        setError('Erro ao carregar dados de vendas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const productsData = products;
  const salesData = sales;
  
  const handleSort = (field: 'date' | 'total' | 'profit') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredSales = salesData
    .filter(sale => {
      // Filter by search term (notes or product names)
      const matchesSearch = searchTerm === '' || 
        sale.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by date
      const matchesDate = dateFilter === '' || 
        new Date(sale.date).toISOString().split('T')[0] === dateFilter;
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      if (sortField === 'total') {
        return sortDirection === 'asc' ? a.total - b.total : b.total - a.total;
      }
      
      if (sortField === 'profit') {
        return sortDirection === 'asc' ? a.profit - b.profit : b.profit - a.profit;
      }
      
      return 0;
    });
  
  const handleAddToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      setError('Por favor, selecione um produto e uma quantidade válida');
      return;
    }
    
    const product = productsData.find(p => p.id === selectedProduct);
    
    if (!product) {
      setError('Produto não encontrado');
      return;
    }
    
    if (product.stock < quantity) {
      setError(`Estoque insuficiente. Disponível: ${product.stock} unidades`);
      return;
    }
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.product_id === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedCart = [...cart];
      const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        setError(`Estoque insuficiente. Disponível: ${product.stock} unidades`);
        return;
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          price: product.selling_price,
          cost: product.cost
        }
      ]);
    }
    
    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    setError('');
  };
  
  const handleRemoveFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const calculateProfit = () => {
    return cart.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0);
  };
  
  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      setError('O carrinho está vazio');
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // await api.post('/sales', {
      //   items: cart,
      //   notes,
      //   total: calculateTotal(),
      //   profit: calculateProfit()
      // });
      
      // Mock response for development
      const newSale: SaleRecord = {
        id: salesData.length + 1,
        date: new Date().toISOString(),
        items: cart,
        total: calculateTotal(),
        profit: calculateProfit(),
        notes
      };
      
      setSales([newSale, ...salesData]);
      
      // Reset form
      setCart([]);
      setNotes('');
      setShowForm(false);
      setError('');
    } catch (err) {
      setError('Erro ao registrar venda');
      console.error(err);
    }
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
        <h1 className="text-2xl font-semibold text-gray-900">Vendas</h1>
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
              Nova Venda
            </>
          )}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registrar Nova Venda
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                  Produto
                </label>
                <select
                  id="product"
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(parseInt(e.target.value) || null)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Selecione um produto</option>
                  {productsData.map((product) => (
                    <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                      {product.name} - R$ {product.selling_price.toFixed(2)} {product.stock <= 0 ? '(Sem estoque)' : `(${product.stock} em estoque)`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 invisible">
                  Adicionar
                </label>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="mt-1 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar
                </button>
              </div>
              
              <div className="sm:col-span-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Carrinho de Compras</h4>
                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum item adicionado</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produto
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preço Unit.
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qtd
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subtotal
                              </th>
                              <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cart.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {item.product_name}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  R$ {item.price.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  R$ {(item.price * item.quantity).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleRemoveFromCart(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                Total:
                              </td>
                              <td className="px-4 py-2 text-sm font-bold text-gray-900">
                                R$ {calculateTotal().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                Lucro:
                              </td>
                              <td className="px-4 py-2 text-sm font-bold text-green-600">
                                R$ {calculateProfit().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Observações (Cliente, etc.)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="sm:col-span-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitSale}
                  disabled={cart.length === 0}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Finalizar Venda
                </button>
              </div>
            </div>
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
              placeholder="Buscar por cliente ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Data
                    {sortField === 'date' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Itens
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Total
                    {sortField === 'total' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center">
                    Lucro
                    {sortField === 'profit' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const date = new Date(sale.date);
                  const formattedDate = date.toLocaleDateString('pt-BR');
                  const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {sale.items.map((item, index) => (
                            <div key={index} className="flex items-start">
                              <Package size={14} className="mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                              <span>
                                {item.quantity}x {item.product_name} 
                                <span className="text-gray-400 ml-1">
                                  (R$ {item.price.toFixed(2)})
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-1 text-gray-400" />
                          R$ {sale.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-1 text-green-500" />
                          R$ {sale.profit.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {sale.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum registro de venda encontrado
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

export default Sales;