// ============================================
// functions/helpers.js
// ============================================

/**
 * Calcula o desconto percentual
 * @param {number} precoAtual O preço atual do produto.
 * @param {number} precoAnterior O preço original do produto.
 * @return {number} O desconto percentual.
 */
function calcularDesconto(precoAtual, precoAnterior) {
  if (!precoAtual || !precoAnterior || precoAnterior === 0) {
    return 0;
  }
  return Math.round(((precoAnterior - precoAtual) / precoAnterior) * 100);
}

/**
 * Valida estrutura de dados do encarte
 * @param {object} dados Os dados do encarte a validar.
 * @return {boolean} True se a estrutura for válida, false caso contrário.
 */
function validarEstruturaDados(dados) {
  if (!dados) return false;
  if (!dados.estabelecimento) return false;
  if (!dados.produtos || !Array.isArray(dados.produtos)) return false;
  if (dados.produtos.length === 0) return false;

  return dados.produtos.every((p) =>
    p.nome &&
    typeof p.preco === "number" &&
    p.preco >= 0,
  );
}

/**
 * Formata um objeto de produto com base nos dados do encarte.
 * @param {object} produto O objeto de produto original.
 * @param {object} dadosEncarte Os dados gerais do encarte.
 * @return {object} O objeto de produto formatado.
 */
function formatarProduto(produto, dadosEncarte) {
  return {
    nome: produto.nome.trim(),
    marca: (produto.marca && produto.marca.trim()) || "",
    categoria: produto.categoria || "outros",
    preco: parseFloat(produto.preco),
    precoAnterior: parseFloat(produto.precoAnterior || produto.preco),
    estabelecimento: dadosEncarte.estabelecimento,
    endereco: dadosEncarte.endereco || "Não especificado",
    validoAte: dadosEncarte.validoAte,
  };
}

module.exports = {
  calcularDesconto,
  validarEstruturaDados,
  formatarProduto,
};
