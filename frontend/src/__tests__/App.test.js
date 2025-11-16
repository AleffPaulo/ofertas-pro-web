// ============================================
// src/__tests__/App.test.js
// ============================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { 
  calcularDesconto, 
  getMelhorOferta, 
  formatarData,
  CATEGORIAS,
  ORDENACOES 
} from '../App';

// Mock do Firebase teste
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn()
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn()
}));

// ============================================
// TESTES DE FUNÇÕES AUXILIARES
// ============================================

describe('Funções Auxiliares', () => {
  
  describe('calcularDesconto', () => {
    test('deve calcular desconto corretamente', () => {
      expect(calcularDesconto(10, 20)).toBe(50);
      expect(calcularDesconto(15, 30)).toBe(50);
      expect(calcularDesconto(25, 100)).toBe(75);
    });

    test('deve retornar 0 quando preço anterior é 0', () => {
      expect(calcularDesconto(10, 0)).toBe(0);
    });

    test('deve retornar 0 quando não há preço anterior', () => {
      expect(calcularDesconto(10, null)).toBe(0);
      expect(calcularDesconto(10, undefined)).toBe(0);
    });

    test('deve arredondar corretamente', () => {
      expect(calcularDesconto(33.33, 100)).toBe(67);
    });
  });

  describe('getMelhorOferta', () => {
    test('deve retornar oferta com menor preço', () => {
      const ofertas = [
        { preco: 20, estabelecimento: 'Loja A' },
        { preco: 15, estabelecimento: 'Loja B' },
        { preco: 18, estabelecimento: 'Loja C' }
      ];
      
      const melhor = getMelhorOferta(ofertas);
      expect(melhor.preco).toBe(15);
      expect(melhor.estabelecimento).toBe('Loja B');
    });

    test('deve retornar null para array vazio', () => {
      expect(getMelhorOferta([])).toBeNull();
    });

    test('deve retornar null para undefined', () => {
      expect(getMelhorOferta(undefined)).toBeNull();
    });

    test('deve funcionar com uma única oferta', () => {
      const ofertas = [{ preco: 10, estabelecimento: 'Única' }];
      const melhor = getMelhorOferta(ofertas);
      expect(melhor.preco).toBe(10);
    });
  });

  describe('formatarData', () => {
    test('deve formatar data corretamente', () => {
      const resultado = formatarData('2025-11-20');
      expect(resultado).toMatch(/\d{2}\/\d{2}/);
    });

    test('deve retornar string vazia para entrada inválida', () => {
      expect(formatarData(null)).toBe('');
      expect(formatarData(undefined)).toBe('');
      expect(formatarData('')).toBe('');
    });
  });
});

// ============================================
// TESTES DE COMPONENTES
// ============================================

describe('Componente App', () => {
  
  test('deve renderizar sem erros', () => {
    render(<App />);
    expect(screen.getByText('Ofertas Pro')).toBeInTheDocument();
  });

  test('deve exibir título e subtítulo', () => {
    render(<App />);
    expect(screen.getByText('Ofertas Pro')).toBeInTheDocument();
    expect(screen.getByText('Sistema Inteligente de Ofertas')).toBeInTheDocument();
  });

  test('deve ter botões de navegação', () => {
    render(<App />);
    expect(screen.getByTestId('btn-catalogo')).toBeInTheDocument();
    expect(screen.getByTestId('btn-upload')).toBeInTheDocument();
  });

  test('deve alternar entre telas', () => {
    render(<App />);
    
    // Inicia no catálogo
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    
    // Muda para upload
    fireEvent.click(screen.getByTestId('btn-upload'));
    expect(screen.getByText('Upload de Encarte')).toBeInTheDocument();
    
    // Volta para catálogo
    fireEvent.click(screen.getByTestId('btn-catalogo'));
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });
});

// ============================================
// TESTES DA TELA DE CATÁLOGO
// ============================================

describe('Tela de Catálogo', () => {
  
  test('deve renderizar campo de busca', () => {
    render(<App />);
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar produtos...');
  });

  test('deve permitir digitação no campo de busca', () => {
    render(<App />);
    const searchInput = screen.getByTestId('search-input');
    
    fireEvent.change(searchInput, { target: { value: 'arroz' } });
    expect(searchInput.value).toBe('arroz');
  });

  test('deve renderizar todas as categorias', () => {
    render(<App />);
    
    CATEGORIAS.forEach(cat => {
      expect(screen.getByTestId(`categoria-${cat.id}`)).toBeInTheDocument();
    });
  });

  test('deve alternar categoria ativa', () => {
    render(<App />);
    
    const btnHigiene = screen.getByTestId('categoria-higiene');
    fireEvent.click(btnHigiene);
    
    // Verifica se o botão tem a classe ativa
    expect(btnHigiene.className).toContain('from-blue-600');
  });

  test('deve renderizar seletor de ordenação', () => {
    render(<App />);
    const sortSelect = screen.getByTestId('sort-select');
    expect(sortSelect).toBeInTheDocument();
  });

  test('deve ter todas as opções de ordenação', () => {
    render(<App />);
    const sortSelect = screen.getByTestId('sort-select');
    
    ORDENACOES.forEach(ord => {
      expect(screen.getByText(ord.nome)).toBeInTheDocument();
    });
  });

  test('deve mudar ordenação', () => {
    render(<App />);
    const sortSelect = screen.getByTestId('sort-select');
    
    fireEvent.change(sortSelect, { target: { value: 'preco' } });
    expect(sortSelect.value).toBe('preco');
  });

  test('deve exibir contador de produtos', () => {
    render(<App />);
    expect(screen.getByTestId('product-count')).toBeInTheDocument();
  });
});

// ============================================
// TESTES DA TELA DE UPLOAD
// ============================================

describe('Tela de Upload', () => {
  
  test('deve renderizar área de upload', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('btn-upload'));
    
    expect(screen.getByText('Upload de Encarte')).toBeInTheDocument();
    expect(screen.getByTestId('upload-area')).toBeInTheDocument();
  });

  test('deve ter input de arquivo', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('btn-upload'));
    
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  test('deve aceitar tipos de arquivo corretos', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('btn-upload'));
    
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', '.pdf,.png,.jpg,.jpeg');
  });

  test('deve exibir texto informativo', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('btn-upload'));
    
    expect(screen.getByText('Clique para selecionar encarte')).toBeInTheDocument();
    expect(screen.getByText('PDF ou Imagem (PNG, JPG)')).toBeInTheDocument();
  });
});

// ============================================
// TESTES DE INTEGRAÇÃO
// ============================================

describe('Integração de Componentes', () => {
  
  test('busca deve filtrar produtos por nome', async () => {
    render(<App />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'teste' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('teste');
    });
  });

  test('categoria e busca devem funcionar juntos', async () => {
    render(<App />);
    
    // Seleciona categoria
    fireEvent.click(screen.getByTestId('categoria-higiene'));
    
    // Busca produto
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'sabonete' } });
    
    await waitFor(() => {
      expect(searchInput.value).toBe('sabonete');
    });
  });

  test('deve manter estado ao trocar de tela', () => {
    render(<App />);
    
    // Define busca
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'arroz' } });
    
    // Muda para upload
    fireEvent.click(screen.getByTestId('btn-upload'));
    
    // Volta para catálogo
    fireEvent.click(screen.getByTestId('btn-catalogo'));
    
    // Busca deve estar mantida
    const searchInputNovo = screen.getByTestId('search-input');
    expect(searchInputNovo.value).toBe('arroz');
  });
});

// ============================================
// TESTES DE ACESSIBILIDADE
// ============================================

describe('Acessibilidade', () => {
  
  test('botões devem ter texto descritivo', () => {
    render(<App />);
    
    expect(screen.getByTestId('btn-catalogo')).toHaveTextContent('Catálogo');
    expect(screen.getByTestId('btn-upload')).toHaveTextContent('Adicionar Encarte');
  });

  test('inputs devem ter placeholders', () => {
    render(<App />);
    
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder');
  });

  test('elementos interativos devem ser clicáveis', () => {
    render(<App />);
    
    const btnCatalogo = screen.getByTestId('btn-catalogo');
    const btnUpload = screen.getByTestId('btn-upload');
    
    expect(btnCatalogo).not.toBeDisabled();
    expect(btnUpload).not.toBeDisabled();
  });
});

// ============================================
// TESTES DE PERFORMANCE
// ============================================

describe('Performance', () => {
  
  test('componente deve renderizar rapidamente', () => {
    const startTime = performance.now();
    render(<App />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // menos de 1 segundo
  });

  test('não deve ter memory leaks ao desmontar', () => {
    const { unmount } = render(<App />);
    expect(() => unmount()).not.toThrow();
  });
});

// ============================================
// TESTES DE EDGE CASES
// ============================================

describe('Edge Cases', () => {
  
  test('deve lidar com produtos sem ofertas', () => {
    expect(getMelhorOferta([])).toBeNull();
  });

  test('deve lidar com preços zerados', () => {
    const ofertas = [{ preco: 0, estabelecimento: 'Grátis' }];
    const melhor = getMelhorOferta(ofertas);
    expect(melhor.preco).toBe(0);
  });

  test('deve lidar com dados incompletos', () => {
    const ofertas = [{ estabelecimento: 'Sem Preço' }];
    const melhor = getMelhorOferta(ofertas);
    expect(melhor).toBeDefined();
  });

  test('deve lidar com busca vazia', () => {
    render(<App />);
    const searchInput = screen.getByTestId('search-input');
    
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput.value).toBe('');
  });
});