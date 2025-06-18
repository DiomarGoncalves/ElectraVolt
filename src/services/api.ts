import axios from 'axios';
import { Fornecedor, MateriaPrima, PrecoFornecedor, Produto } from '../types';

// Detecta ambiente: se rodando em Vercel/produção, usa caminho relativo
const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para log de requisições
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Fornecedores
export const fornecedoresAPI = {
  getAll: () => api.get<Fornecedor[]>('/fornecedores'),
  create: (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => 
    api.post<Fornecedor>('/fornecedores', data),
  update: (id: number, data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => 
    api.put<Fornecedor>(`/fornecedores/${id}`, data),
  delete: (id: number) => api.delete(`/fornecedores/${id}`),
};

// Matérias-primas
export const materiasAPI = {
  getAll: () => api.get<MateriaPrima[]>('/materias'),
  create: (data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => 
    api.post<MateriaPrima>('/materias', data),
  update: (id: number, data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => 
    api.put<MateriaPrima>(`/materias/${id}`, data),
  delete: (id: number) => api.delete(`/materias/${id}`),
};

// Preços
export const precosAPI = {
  getAll: () => api.get<PrecoFornecedor[]>('/precos'),
  getByMateria: (materiaId: number) => api.get<PrecoFornecedor[]>(`/precos/materia/${materiaId}`),
  createOrUpdate: (data: { fornecedor_id: number; materia_id: number; preco: number }) => 
    api.post<PrecoFornecedor>('/precos', data),
  delete: (id: number) => api.delete(`/precos/${id}`),
};

// Produtos
export const produtosAPI = {
  getAll: () => api.get<Produto[]>('/produtos'),
  getById: (id: number) => api.get<Produto>(`/produtos/${id}`),
  create: (data: { nome: string; preco_venda: number; composicao: Omit<ComposicaoItem, 'id'>[] }) => 
    api.post<Produto>('/produtos', data),
  update: (id: number, data: { nome: string; preco_venda: number; composicao: Omit<ComposicaoItem, 'id'>[] }) => 
    api.put<Produto>(`/produtos/${id}`, data),
  delete: (id: number) => api.delete(`/produtos/${id}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;