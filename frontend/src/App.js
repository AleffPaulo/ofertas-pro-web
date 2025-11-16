// ============================================
// src/App.js - Frontend React Web
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar, 
  MapPin, 
  Package, 
  Sparkles, 
  X,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Configuração Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDzLGqwKQlC4oMXkCJUSmMinBYB0KBqg1s",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ofertas-pro-web.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ofertas-pro-web",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ofertas-pro-web.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "212286008408",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:212286008408:web:f2018df921095fda352e2d"
};

// Inicializar Firebase apenas se não estiver em modo de teste
let db, storage, functions;
if (process.env.NODE_ENV !== 'test') {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
}

// Categorias disponíveis
export const CATEGORIAS = [
  { id: 'todas', nome: 'Todas', icon: Package },
  { id: 'higiene', nome: 'Higiene', icon: Sparkles },
  { id: 'limpeza', nome: 'Limpeza', icon: Sparkles },
  { id: 'alimentos', nome: 'Alimentos', icon: Package },
  { id: 'outros', nome: 'Outros', icon: Package }
];

// Opções de ordenação
export const ORDENACOES = [
  { id: 'desconto', nome: 'Maior Desconto' },
  { id: 'preco', nome: 'Menor Preço' },
  { id: 'validade', nome: 'Expirando Primeiro' },
  { id: 'alfabetica', nome: 'A-Z' }
];

// Funções auxiliares (exportadas para testes)
export const calcularDesconto = (precoAtual, precoAnterior) => {
  if (!precoAnterior || precoAnterior === 0) return 0;
  return Math.round(((precoAnterior - precoAtual) / precoAnterior) * 100);
};

export const getMelhorOferta = (ofertas) => {
  if (!ofertas || ofertas.length === 0) return null;
  return ofertas.reduce((melhor, atual) => 
    atual.preco < melhor.preco ? atual : melhor
  );
};

export const formatarData = (dataString) => {
  if (!dataString) return '';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Componente Principal
function App() {
  const [tela, setTela] = useState('catalogo');
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [ordenacao, setOrdenacao] = useState('desconto');
  const [busca, setBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar produtos do Firestore
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'produtos'), orderBy('criadoEm', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const produtosArray = [];
      snapshot.forEach((doc) => {
        produtosArray.push({ id: doc.id, ...doc.data() });
      });
      setProdutos(produtosArray);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar produtos:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Processar encarte
  const processarEncarte = async (file) => {
    if (process.env.NODE_ENV === 'test') return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);
      const storageRef = ref(storage, `encartes/${file.name}`);
      await uploadBytes(storageRef, file);
      
      setUploadProgress(60);
      const processFunc = httpsCallable(functions, 'processarEncarte');
      const result = await processFunc({
        fileName: file.name,
        fileType: file.name.split('.').pop().toLowerCase()
      });

      setUploadProgress(100);
      alert(`✅ ${result.data.produtosAdicionados} produtos adicionados!`);
      setTela('catalogo');
      
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao processar encarte: ' + error.message);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processarEncarte(file);
    }
  };

  // Filtrar e ordenar produtos
  const produtosFiltrados = produtos
    .filter(p => categoriaAtiva === 'todas' || p.categoria === categoriaAtiva)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      if (!a.ofertas || !b.ofertas) return 0;
      const ofertaA = getMelhorOferta(a.ofertas);
      const ofertaB = getMelhorOferta(b.ofertas);
      
      if (!ofertaA || !ofertaB) return 0;
      
      switch(ordenacao) {
        case 'desconto':
          return calcularDesconto(ofertaB.preco, ofertaB.precoAnterior) - 
                 calcularDesconto(ofertaA.preco, ofertaA.precoAnterior);
        case 'preco':
          return ofertaA.preco - ofertaB.preco;
        case 'validade':
          return new Date(ofertaA.validoAte) - new Date(ofertaB.validoAte);
        case 'alfabetica':
          return a.nome.localeCompare(b.nome);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <TrendingDown className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Ofertas Pro</h1>
                <p className="text-sm text-gray-500">Sistema Inteligente de Ofertas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                data-testid="btn-catalogo"
                onClick={() => setTela('catalogo')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  tela === 'catalogo' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Catálogo
              </button>
              <button
                data-testid="btn-upload"
                onClick={() => setTela('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  tela === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload size={20} className="inline mr-2" />
                Adicionar Encarte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tela de Upload */}
      {tela === 'upload' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload de Encarte</h2>
            
            {!isProcessing ? (
              <label className="block">
                <div 
                  className="border-4 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition bg-blue-50 hover:bg-blue-100"
                  data-testid="upload-area"
                >
                  <Upload size={64} className="mx-auto text-blue-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    Clique para selecionar encarte
                  </p>
                  <p className="text-gray-500">PDF ou Imagem (PNG, JPG)</p>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="file-input"
                  />
                </div>
              </label>
            ) : (
              <div className="space-y-4" data-testid="processing-indicator">
                <div className="flex items-center gap-3 text-blue-600">
                  <Sparkles className="animate-spin" size={24} />
                  <span className="text-lg font-semibold">Processando com IA...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tela de Catálogo */}
      {tela === 'catalogo' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {CATEGORIAS.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
                    categoriaAtiva === cat.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  data-testid={`categoria-${cat.id}`}
                >
                  <Icon size={18} />
                  {cat.nome}
                </button>
              );
            })}
          </div>

          {/* Header com contador e ordenação */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 font-medium" data-testid="product-count">
              {produtosFiltrados.length} produtos encontrados
            </p>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-medium bg-white"
                data-testid="sort-select"
              >
                {ORDENACOES.map(ord => (
                  <option key={ord.id} value={ord.id}>{ord.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Produtos */}
          {loading ? (
            <div className="text-center py-12" data-testid="loading-indicator">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando produtos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtosFiltrados.map(produto => {
                const melhorOferta = getMelhorOferta(produto.ofertas);
                if (!melhorOferta) return null;
                
                const desconto = calcularDesconto(melhorOferta.preco, melhorOferta.precoAnterior);
                
                return (
                  <div
                    key={produto.id}
                    onClick={() => setProdutoSelecionado(produto)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer p-4"
                    data-testid={`produto-${produto.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700 uppercase">
                        {produto.categoria}
                      </span>
                      {desconto > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-red-500 text-white">
                          -{desconto}%
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                      {produto.nome}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-600">
                          R$ {melhorOferta.preco.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          R$ {melhorOferta.precoAnterior.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span className="truncate">{melhorOferta.estabelecimento}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>Até {formatarData(melhorOferta.validoAte)}</span>
                      </div>
                      
                      {produto.ofertas.length > 1 && (
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-blue-600">
                            + {produto.ofertas.length - 1} ofertas disponíveis
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes */}
      {produtoSelecionado && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
          onClick={() => setProdutoSelecionado(null)}
          data-testid="product-modal"
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{produtoSelecionado.nome}</h2>
              <button 
                onClick={() => setProdutoSelecionado(null)} 
                className="text-gray-400 hover:text-gray-600"
                data-testid="close-modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {produtoSelecionado.ofertas?.map((oferta, index) => {
                const desconto = calcularDesconto(oferta.preco, oferta.precoAnterior);
                return (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{oferta.estabelecimento}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} />
                          {oferta.endereco}
                        </p>
                      </div>
                      {desconto > 0 && (
                        <span className="text-sm font-bold px-3 py-1 rounded-full bg-red-500 text-white">
                          -{desconto}%
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Preço</p>
                        <p className="text-2xl font-bold text-green-600">R$ {oferta.preco.toFixed(2)}</p>
                        <p className="text-sm text-gray-400 line-through">R$ {oferta.precoAnterior.toFixed(2)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Válido até</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {formatarData(oferta.validoAte)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;