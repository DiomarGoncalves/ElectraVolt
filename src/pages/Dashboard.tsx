import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  AlertTriangle, Truck, BarChart2, ShoppingCart 
} from 'lucide-react';

interface DashboardData {
  totalProducts: number;
  totalMaterials: number;
  totalSuppliers: number;
  totalSales: number;
  monthlyProfit: number;
  lowStockItems: Array<{id: number, name: string, stock: number}>;
  topProducts: Array<{id: number, name: string, profit: number}>;
  monthlySales: Array<{month: string, amount: number}>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
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
    );
  }
  
  // Remover mock data for development
  // const mockData: DashboardData = { ... };

  const dashboardData = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Package size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Produtos</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lucro Mensal</p>
              <p className="text-2xl font-semibold text-gray-900">
                R$ {dashboardData.monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Truck size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Fornecedores</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalSuppliers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ShoppingCart size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vendas Realizadas</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalSales}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendas Mensais</h2>
          <div className="h-64 flex items-end space-x-2">
            {dashboardData.monthlySales.map((item, index) => {
              const height = (item.amount / Math.max(...dashboardData.monthlySales.map(s => s.amount))) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs font-medium text-gray-500 mt-2">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Lucrativos</h2>
          <div className="space-y-4">
            {dashboardData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center">
                <div className={`p-2 rounded-full ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                  index === 1 ? 'bg-gray-100 text-gray-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                  <TrendingUp size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <Link to={`/products/edit/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {product.name}
                  </Link>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  R$ {product.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Low Stock Alert */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estoque Crítico</h2>
        {dashboardData.lowStockItems.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <Link to={`/materials/edit/${item.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {item.name}
                  </Link>
                </div>
                <div className="text-sm font-semibold text-red-600">
                  Estoque: {item.stock} unidades
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum item com estoque crítico no momento.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;