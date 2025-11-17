// ============================================
// functions/__tests__/index.test.js
// ============================================

const {
  calcularDesconto, validarEstruturaDados, formatarProduto,
} = require("../helpers");

describe("Helpers Backend", () => {
  describe("calcularDesconto", () => {
    test("calcula desconto corretamente", () => {
      expect(calcularDesconto(50, 100)).toBe(50);
      expect(calcularDesconto(75, 100)).toBe(25);
    });

    test("retorna 0 para valores inválidos", () => {
      expect(calcularDesconto(null, 100)).toBe(0);
      expect(calcularDesconto(50, 0)).toBe(0);
    });
  });

  describe("validarEstruturaDados", () => {
    test("valida estrutura correta", () => {
      const dados = {
        estabelecimento: "Teste",
        produtos: [{nome: "Produto", preco: 10}],
      };
      expect(validarEstruturaDados(dados)).toBe(true);
    });

    test("rejeita estrutura inválida", () => {
      expect(validarEstruturaDados(null)).toBe(false);
      expect(validarEstruturaDados({})).toBe(false);
      expect(validarEstruturaDados({estabelecimento: "Teste"})).toBe(false);
    });
  });

  describe("formatarProduto", () => {
    test("formata produto corretamente", () => {
      const produto = {nome: "  Arroz  ", preco: "19.90"};
      const encarte = {estabelecimento: "Loja", validoAte: "2025-12-31"};

      const resultado = formatarProduto(produto, encarte);

      expect(resultado.nome).toBe("Arroz");
      expect(resultado.preco).toBe(19.90);
      expect(resultado.estabelecimento).toBe("Loja");
    });
  });
});
