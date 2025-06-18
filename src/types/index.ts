export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  total_precos?: number;
  created_at: string;
  updated_at: string;
}

export interface MateriaPrima {
  id: number;
  nome: string;
  unidade: string;
  estoque: number;
  descricao: string;
  total_fornecedores?: number;
  preco_medio?: number;
  created_at: string;
  updated_at: string;
}

export interface PrecoFornecedor {
  [x: string]: string;
  id: number;
  fornecedor_id: number;
  materia_id: number;
  preco: number;
  fornecedor_nome?: string;
  materia_nome?: string;
  unidade?: string;
  created_at: string;
  updated_at: string;
}

export interface ComposicaoItem {
  id?: number;
  materia_id: number;
  fornecedor_id: number;
  quantidade: number;
  materia_nome?: string;
  fornecedor_nome?: string;
  unidade?: string;
  preco?: number;
}

export interface Produto {
  id: number;
  nome: string;
  preco_venda: number;
  composicao: ComposicaoItem[];
  created_at: string;
  updated_at: string;
}

export interface CalculoCusto {
  custoMateriais: number;
  custoTotal: number;
  precoVenda: number;
  margemLucro: number;
  lucroAbsoluto: number;
  breakdown: {
    materia_id: number;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    custoTotal: number;
    fornecedor: string;
  }[];
}

export interface AppState {
  fornecedores: Fornecedor[];
  materiasPrimas: MateriaPrima[];
  precosFornecedores: PrecoFornecedor[];
  produtos: Produto[];
}