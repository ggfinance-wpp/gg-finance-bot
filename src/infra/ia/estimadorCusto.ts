function estimarTokens(texto: string) {
  return Math.ceil(texto.length / 4);
}

/**
 * Preços aproximados (USD / token)
 * Base: preços públicos 2025
 */
const PRECO = {
  gemini: {
    // Gemini Flash (estimativa)
    input: 0.00000035,  // $0.35 / 1M
    output: 0.00000105  // $1.05 / 1M
  },
  gpt4oMini: {
    // GPT-4o-mini
    input: 0.00000015,  // $0.15 / 1M
    output: 0.00000060  // $0.60 / 1M
  }
};

export function estimarCustosComparativos(prompt: string, resposta: string) {
  const tokensEntrada = estimarTokens(prompt);
  const tokensSaida = estimarTokens(resposta);

  const custoGemini =
    tokensEntrada * PRECO.gemini.input +
    tokensSaida * PRECO.gemini.output;

  const custoGPT =
    tokensEntrada * PRECO.gpt4oMini.input +
    tokensSaida * PRECO.gpt4oMini.output;

  return {
    tokensEntrada,
    tokensSaida,
    geminiUSD: custoGemini,
    gptUSD: custoGPT
  };
}
