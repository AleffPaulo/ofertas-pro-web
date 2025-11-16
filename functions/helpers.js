// ============================================
// functions/helpers.js
// ============================================

/**
 * Calcula o desconto percentual
 */
function calcularDesconto(precoAtual, precoAnterior) {
    if (!precoAtual || !precoAnterior || precoAnterior === 0) {
      return 0;
    }
    return Math.round(((precoAnterior - precoAtual) / precoAnterior) * 100);
  }
  
  /**
   * Valida estrutura de dados do encarte
   */
  function validarEstruturaDados(dados) {
    if (!dados) return false;
    if (!dados.estabelecimento) return false;
    if (!dados.produtos || !Array.isArray(dados.produtos)) return false;
    if (dados.produtos.length === 0) return false;
    
    return dados.produtos.every(p => 
      p.nome && 
      typeof p.preco === 'number' &&
      p.preco >= 0
    );
  }
  
  /**
   * Formata dados do produto
   */
  function formatarProduto(produto, dadosEncarte) {
    return {
      nome: produto.nome.trim(),
      marca: produto.marca?.trim() || '',
      categoria: produto.categoria || 'outros',
      preco: parseFloat(produto.preco),
      precoAnterior: parseFloat(produto.precoAnterior || produto.preco),
      estabelecimento: dadosEncarte.estabelecimento,
      endereco: dadosEncarte.endereco || 'Não especificado',
      validoAte: dadosEncarte.validoAte
    };
  }
  
  module.exports = {
    calcularDesconto,
    validarEstruturaDados,
    formatarProduto
  };