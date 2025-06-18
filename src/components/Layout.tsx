import React, { ReactNode, useState } from 'react';
import { Building2, Package, Users, Calculator, BarChart3, Settings, Menu, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void; // Adicionado
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'materias', label: 'Matérias-Primas', icon: Package },
    { id: 'produtos', label: 'Produtos', icon: Building2 },
    { id: 'simulacoes', label: 'Simulações', icon: Calculator },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Sistema de Custos - Conversores de Tensão
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                className="sm:hidden p-2 rounded hover:bg-gray-100"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <Settings className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors hidden sm:block" />
              {/* Botão Sair */}
              <button
                onClick={onLogout}
                className="p-2 rounded hover:bg-gray-100 flex items-center"
                title="Sair"
              >
                <LogOut className="h-5 w-5 text-gray-500" />
                <span className="ml-1 hidden sm:inline text-gray-700">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {/* Mobile Dropdown */}
      <nav className="bg-white border-b border-gray-200 sm:hidden">
        {mobileMenuOpen && (
          <div className="px-2 py-2 space-y-1 shadow-md z-50 bg-white">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-3 text-base font-medium rounded ${
                    currentTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>
      {/* Desktop Tabs */}
      <nav className="bg-white border-b border-gray-200 overflow-x-auto hidden sm:block">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">{tab.label}</span>
                  {/* xs: custom breakpoint, use sm:inline if xs not available */}
                  <span className="sm:inline hidden">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;