import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Fornecedores from './components/Fornecedores';
import MateriasPrimas from './components/MateriasPrimas';
import Produtos from './components/Produtos';
import Simulacoes from './components/Simulacoes';
import Relatorios from './components/Relatorios';
import Login from './components/Login';

function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [loggedIn, setLoggedIn] = useState<boolean>(() => localStorage.getItem('loggedIn') === 'true');

  useEffect(() => {
    if (loggedIn) localStorage.setItem('loggedIn', 'true');
    else localStorage.removeItem('loggedIn');
  }, [loggedIn]);

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

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem('loggedIn');
  };

  return (
    <AppProvider>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab} onLogout={handleLogout}>
        {renderCurrentTab()}
      </Layout>
    </AppProvider>
  );
}

export default App;