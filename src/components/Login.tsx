import React, { useState } from 'react';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = import.meta.env.VITE_LOGIN_USER;
    const envPass = import.meta.env.VITE_LOGIN_PASS;
    if (user === envUser && pass === envPass) {
      localStorage.setItem('loggedIn', 'true');
      onLogin();
    } else {
      setError('Usuário ou senha inválidos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-xs">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
        <input
          type="text"
          placeholder="Usuário"
          value={user}
          onChange={e => setUser(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={pass}
          onChange={e => setPass(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
