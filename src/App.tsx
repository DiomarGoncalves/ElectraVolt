import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Fornecedores from './components/Fornecedores';
import MateriasPrimas from './components/MateriasPrimas';
import Produtos from './components/Produtos';
import Simulacoes from './components/Simulacoes';
import Relatorios from './components/Relatorios';

function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'fornecedores':
        return <Fornecedores />;
      case 'materias':
        return <MateriasPrimas />;
      case 'produtos':
        return <Produtos />;
      case 'simulacoes':
        return <Simulacoes />;
      case 'relatorios':
        return <Relatorios />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {renderCurrentTab()}
      </Layout>
    </AppProvider>
  );
}

export default App;