import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart2, PieChart, TrendingUp, Download, 
  Calendar, Filter, AlertTriangle, DollarSign,
  Package, Truck, ShoppingCart
} from 'lucide-react';

interface ReportData {
  salesByMonth: Array<{
    month: string;
    sales: number;
    profit: number;
  }>;
  
  topProducts: Array<{
    id: number;
    name: string;
    quantity: number;
    profit: number;
  }>;
  
  topSuppliers: Array<{
    id: number;
    name: string;
    total_purchases: number;
    savings: number;
  }>;
  
  inventoryValue: {
    products: number;
    materials: number;
    total: number;
  };
  
  profitMargins: Array<{
    range: string;
    count: number;
  }>;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await api.get(`/reports?range=${dateRange}`);
        setReportData(response.data);
      } catch (err) {
        setError('Erro ao carregar dados dos relatórios');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange]);
  
  const data = reportData;

  const handleExportReport = () => {
    // In a real app, this would generate a CSV or PDF report
    alert('Relatório exportado com sucesso!');
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
        <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
        
        <div className="flex space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'month' | 'quarter' | 'year')}
            >
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Último Ano</option>
            </select>
          </div>
          
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ShoppingCart size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
              <p className="text-2xl font-semibold text-gray-900">
                R$ {data.salesByMonth.reduce((sum, month) => sum + month.sales, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <DollarSign size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lucro Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                R$ {data.salesByMonth.reduce((sum, month) => sum + month.profit, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Package size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Valor do Estoque</p>
              <p className="text-2xl font-semibold text-gray-900">
                R$ {data.inventoryValue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Vendas e Lucro por Mês</h2>
            <BarChart2 size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-end space-x-2">
            {data.salesByMonth.map((item, index) => {
              const salesHeight = (item.sales / Math.max(...data.salesByMonth.map(s => s.sales))) * 100;
              const profitHeight = (item.profit / Math.max(...data.salesByMonth.map(s => s.sales))) * 100;
              
              return (
                <div key={index} className="flex-1 flex items-end space-x-1">
                  <div className="w-1/2 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${salesHeight}%` }}
                    ></div>
                    <div className="text-xs font-medium text-gray-500 mt-2">{item.month}</div>
                  </div>
                  <div className="w-1/2 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${profitHeight}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Vendas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Lucro</span>
            </div>
          </div>
        </div>
        
        {/* Profit Margins Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Distribuição de Margens de Lucro</h2>
            <PieChart size={20} className="text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-gray-100 relative">
              {data.profitMargins.map((segment, index) => {
                const total = data.profitMargins.reduce((sum, item) => sum + item.count, 0);
                const percentage = (segment.count / total) * 100;
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500', 'bg-green-600'];
                
                // This is a simplified representation - in a real app, you'd use a proper chart library
                return (
                  <div 
                    key={index}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${colors[index]} rounded-full`}
                    style={{ 
                      width: `${Math.max(percentage, 10)}%`, 
                      height: `${Math.max(percentage, 10)}%`,
                      zIndex: 10 - index
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap justify-center mt-4 gap-4">
            {data.profitMargins.map((segment, index) => {
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500', 'bg-green-600'];
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 ${colors[index]} rounded-full mr-2`}></div>
                  <span className="text-sm text-gray-600">{segment.range} ({segment.count} produtos)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Top Products and Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Produtos Mais Lucrativos
            </h3>
            <Package size={20} className="text-gray-400" />
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {data.topProducts.map((product, index) => (
                <li key={product.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                        index === 1 ? 'bg-gray-100 text-gray-600' : 
                        index === 2 ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {index < 3 ? (
                          <span className="text-lg font-bold">{index + 1}</span>
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.quantity} unidades vendidas</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp size={16} className="text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                        R$ {product.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Top Suppliers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Melhores Fornecedores
            </h3>
            <Truck size={20} className="text-gray-400" />
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {data.topSuppliers.map((supplier, index) => (
                <li key={supplier.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-100 text-green-600' : 
                        index === 1 ? 'bg-blue-100 text-blue-600' : 
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <Truck size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">
                          R$ {supplier.total_purchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em compras
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">
                        R$ {supplier.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} economizados
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Inventory Value */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Valor do Estoque</h2>
          <Package size={20} className="text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Produtos Acabados</p>
                <p className="text-2xl font-bold text-blue-900">
                  R$ {data.inventoryValue.products.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Package size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Matérias-Prima</p>
                <p className="text-2xl font-bold text-green-900">
                  R$ {data.inventoryValue.materials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Package size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {data.inventoryValue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;