import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Fornecedor, MateriaPrima, PrecoFornecedor, Produto } from '../types';
import { fornecedoresAPI, materiasAPI, precosAPI, produtosAPI } from '../services/api';

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FORNECEDORES'; payload: Fornecedor[] }
  | { type: 'SET_MATERIAS_PRIMAS'; payload: MateriaPrima[] }
  | { type: 'SET_PRECOS_FORNECEDORES'; payload: PrecoFornecedor[] }
  | { type: 'SET_PRODUTOS'; payload: Produto[] }
  | { type: 'ADD_FORNECEDOR'; payload: Fornecedor }
  | { type: 'UPDATE_FORNECEDOR'; payload: Fornecedor }
  | { type: 'DELETE_FORNECEDOR'; payload: number }
  | { type: 'ADD_MATERIA_PRIMA'; payload: MateriaPrima }
  | { type: 'UPDATE_MATERIA_PRIMA'; payload: MateriaPrima }
  | { type: 'DELETE_MATERIA_PRIMA'; payload: number }
  | { type: 'ADD_PRECO_FORNECEDOR'; payload: PrecoFornecedor }
  | { type: 'DELETE_PRECO_FORNECEDOR'; payload: number }
  | { type: 'ADD_PRODUTO'; payload: Produto }
  | { type: 'UPDATE_PRODUTO'; payload: Produto }
  | { type: 'DELETE_PRODUTO'; payload: number };

interface AppStateWithMeta extends AppState {
  loading: boolean;
  error: string | null;
}

const initialState: AppStateWithMeta = {
  fornecedores: [],
  materiasPrimas: [],
  precosFornecedores: [],
  produtos: [],
  loading: false,
  error: null,
};

const appReducer = (state: AppStateWithMeta, action: AppAction): AppStateWithMeta => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_FORNECEDORES':
      return { ...state, fornecedores: action.payload };
    case 'SET_MATERIAS_PRIMAS':
      return { ...state, materiasPrimas: action.payload };
    case 'SET_PRECOS_FORNECEDORES':
      return { ...state, precosFornecedores: action.payload };
    case 'SET_PRODUTOS':
      return { ...state, produtos: action.payload };
    case 'ADD_FORNECEDOR':
      return { ...state, fornecedores: [...state.fornecedores, action.payload] };
    case 'UPDATE_FORNECEDOR':
      return {
        ...state,
        fornecedores: state.fornecedores.map(f => 
          f.id === action.payload.id ? action.payload : f
        )
      };
    case 'DELETE_FORNECEDOR':
      return {
        ...state,
        fornecedores: state.fornecedores.filter(f => f.id !== action.payload),
        precosFornecedores: state.precosFornecedores.filter(p => p.fornecedor_id !== action.payload)
      };
    case 'ADD_MATERIA_PRIMA':
      return { ...state, materiasPrimas: [...state.materiasPrimas, action.payload] };
    case 'UPDATE_MATERIA_PRIMA':
      return {
        ...state,
        materiasPrimas: state.materiasPrimas.map(m => 
          m.id === action.payload.id ? action.payload : m
        )
      };
    case 'DELETE_MATERIA_PRIMA':
      return {
        ...state,
        materiasPrimas: state.materiasPrimas.filter(m => m.id !== action.payload),
        precosFornecedores: state.precosFornecedores.filter(p => p.materia_id !== action.payload)
      };
    case 'ADD_PRECO_FORNECEDOR':
      return { 
        ...state, 
        precosFornecedores: [
          ...state.precosFornecedores.filter(p => 
            !(p.fornecedor_id === action.payload.fornecedor_id && p.materia_id === action.payload.materia_id)
          ),
          action.payload
        ]
      };
    case 'DELETE_PRECO_FORNECEDOR':
      return {
        ...state,
        precosFornecedores: state.precosFornecedores.filter(p => p.id !== action.payload)
      };
    case 'ADD_PRODUTO':
      return { ...state, produtos: [...state.produtos, action.payload] };
    case 'UPDATE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'DELETE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.filter(p => p.id !== action.payload)
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppStateWithMeta;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    // Fornecedores
    loadFornecedores: () => Promise<void>;
    createFornecedor: (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => Promise<void>;
    updateFornecedor: (id: number, data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => Promise<void>;
    deleteFornecedor: (id: number) => Promise<void>;
    
    // Matérias-primas
    loadMateriasPrimas: () => Promise<void>;
    createMateriaPrima: (data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => Promise<void>;
    updateMateriaPrima: (id: number, data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => Promise<void>;
    deleteMateriaPrima: (id: number) => Promise<void>;
    
    // Preços
    loadPrecos: () => Promise<void>;
    createOrUpdatePreco: (data: { fornecedor_id: number; materia_id: number; preco: number }) => Promise<void>;
    deletePreco: (id: number) => Promise<void>;
    
    // Produtos
    loadProdutos: () => Promise<void>;
    createProduto: (data: { nome: string; preco_venda: number; composicao: any[] }) => Promise<void>;
    updateProduto: (id: number, data: { nome: string; preco_venda: number; composicao: any[] }) => Promise<void>;
    deleteProduto: (id: number) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    // Fornecedores
    loadFornecedores: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await fornecedoresAPI.getAll();
        dispatch({ type: 'SET_FORNECEDORES', payload: response.data });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createFornecedor: async (data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => {
      try {
        const response = await fornecedoresAPI.create(data);
        dispatch({ type: 'ADD_FORNECEDOR', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    updateFornecedor: async (id: number, data: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'total_precos'>) => {
      try {
        const response = await fornecedoresAPI.update(id, data);
        dispatch({ type: 'UPDATE_FORNECEDOR', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    deleteFornecedor: async (id: number) => {
      try {
        await fornecedoresAPI.delete(id);
        dispatch({ type: 'DELETE_FORNECEDOR', payload: id });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Matérias-primas
    loadMateriasPrimas: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await materiasAPI.getAll();
        dispatch({ type: 'SET_MATERIAS_PRIMAS', payload: response.data });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createMateriaPrima: async (data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => {
      try {
        const response = await materiasAPI.create(data);
        dispatch({ type: 'ADD_MATERIA_PRIMA', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    updateMateriaPrima: async (id: number, data: Omit<MateriaPrima, 'id' | 'created_at' | 'updated_at' | 'total_fornecedores' | 'preco_medio'>) => {
      try {
        const response = await materiasAPI.update(id, data);
        dispatch({ type: 'UPDATE_MATERIA_PRIMA', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    deleteMateriaPrima: async (id: number) => {
      try {
        await materiasAPI.delete(id);
        dispatch({ type: 'DELETE_MATERIA_PRIMA', payload: id });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Preços
    loadPrecos: async () => {
      try {
        const response = await precosAPI.getAll();
        dispatch({ type: 'SET_PRECOS_FORNECEDORES', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    createOrUpdatePreco: async (data: { fornecedor_id: number; materia_id: number; preco: number }) => {
      try {
        const response = await precosAPI.createOrUpdate(data);
        dispatch({ type: 'ADD_PRECO_FORNECEDOR', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    deletePreco: async (id: number) => {
      try {
        await precosAPI.delete(id);
        dispatch({ type: 'DELETE_PRECO_FORNECEDOR', payload: id });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Produtos
    loadProdutos: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await produtosAPI.getAll();
        dispatch({ type: 'SET_PRODUTOS', payload: response.data });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createProduto: async (data: { nome: string; preco_venda: number; composicao: any[] }) => {
      try {
        const response = await produtosAPI.create(data);
        dispatch({ type: 'ADD_PRODUTO', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    updateProduto: async (id: number, data: { nome: string; preco_venda: number; composicao: any[] }) => {
      try {
        const response = await produtosAPI.update(id, data);
        dispatch({ type: 'UPDATE_PRODUTO', payload: response.data });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    deleteProduto: async (id: number) => {
      try {
        await produtosAPI.delete(id);
        dispatch({ type: 'DELETE_PRODUTO', payload: id });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        actions.loadFornecedores(),
        actions.loadMateriasPrimas(),
        actions.loadPrecos(),
        actions.loadProdutos(),
      ]);
    };

    loadInitialData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};