import { GoogleGenerativeAI } from "@google/generative-ai";

import { CLASSIFICADOR_DOMINIO_PROMPT } from "./prompts/classificadorDominio.prompt";
import { PROMPT_FINANCEIRO } from "./prompts/financeiro.prompt";
import { PROMPT_LEMBRETE } from "./prompts/lembrete.prompt";
import { PROMPT_CONSULTA } from "./prompts/consulta.prompt";
import { PROMPT_FALLBACK_COMPLETO } from "./prompts/fallbackCompleto.prompt";

import { IAUsageLogger } from "../infra/ia/IAUsageLogger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function estimarTokens(texto: string) {
  return Math.ceil(texto.length / 4);
}

// Preços públicos aproximados (USD / token)
const PRECO = {
  gemini: {
    input: 0.35 / 1_000_000,
    output: 1.05 / 1_000_000
  },
  gpt: {
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000
  }
};

export class InterpretadorGemini {

  static async interpretarMensagem(mensagem: string, contexto: any = {}) {

    // 1️⃣ CLASSIFICADOR DE DOMÍNIO
    const promptClassificador = CLASSIFICADOR_DOMINIO_PROMPT(mensagem);
    const dominioResposta = await modelo.generateContent(promptClassificador);
    const textoDominio = dominioResposta.response.text().trim();

    let dominio = "outro";
    try {
      dominio = JSON.parse(textoDominio).dominio;
    } catch {
      dominio = "outro";
    }

    // 🔹 LOG CLASSIFICADOR
    {
      const tokensIn = estimarTokens(promptClassificador);
      const tokensOut = estimarTokens(textoDominio);

      IAUsageLogger.log({
        usuarioId: contexto?.usuario?.id,
        etapa: "classificador", // ✅ ajuste correto
        model: "gemini-2.5-flash",
        promptChars: promptClassificador.length,
        respostaChars: textoDominio.length,
        tokensEntrada: tokensIn,
        tokensSaida: tokensOut,
        geminiUSD:
          tokensIn * PRECO.gemini.input +
          tokensOut * PRECO.gemini.output,
        gptUSD:
          tokensIn * PRECO.gpt.input +
          tokensOut * PRECO.gpt.output
      });

    }

    // 2️⃣ ESCOLHA DO PROMPT
    let promptFinal: string;

    switch (dominio) {
      case "financeiro":
        promptFinal = PROMPT_FINANCEIRO(mensagem);
        break;
      case "lembrete":
        promptFinal = PROMPT_LEMBRETE(mensagem);
        break;
      case "consulta":
        promptFinal = PROMPT_CONSULTA(mensagem);
        break;
      default:
        promptFinal = PROMPT_FALLBACK_COMPLETO(mensagem);
        break;
    }

    // 3️⃣ CHAMADA PRINCIPAL
    const resposta = await modelo.generateContent(promptFinal);
    let texto = resposta.response.text().trim();

    // 🔹 LOG PRINCIPAL
    {
      const tokensIn = estimarTokens(promptFinal);
      const tokensOut = estimarTokens(texto);

      IAUsageLogger.log({
        usuarioId: contexto?.usuario?.id,
        etapa: "principal",
        model: "gemini-2.5-flash",
        promptChars: promptFinal.length,
        respostaChars: texto.length,
        tokensEntrada: tokensIn,
        tokensSaida: tokensOut,
        geminiUSD:
          tokensIn * PRECO.gemini.input +
          tokensOut * PRECO.gemini.output,
        gptUSD:
          tokensIn * PRECO.gpt.input +
          tokensOut * PRECO.gpt.output
      });
    }

    // 4️⃣ LIMPEZA (inalterada)
    texto = texto
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/\\n/g, "\n")
      .trim();

    const match = texto.match(/(\[|\{)[\s\S]*$/);
    if (match) texto = match[0];

    // 5️⃣ PARSE FINAL (inalterado)
    try {
      return JSON.parse(texto);
    } catch (e) {
      console.error("Erro ao interpretar JSON da IA:", texto);
      return [{ acao: "desconhecido" }];
    }
  }
}
