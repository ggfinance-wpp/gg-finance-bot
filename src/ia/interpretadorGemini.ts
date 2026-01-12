import { GoogleGenerativeAI } from "@google/generative-ai";

import { CLASSIFICADOR_DOMINIO_PROMPT } from "./prompts/classificadorDominio.prompt";
import { PROMPT_FINANCEIRO } from "./prompts/financeiro.prompt";
import { PROMPT_LEMBRETE } from "./prompts/lembrete.prompt";
import { PROMPT_CONSULTA } from "./prompts/consulta.prompt";
import { PROMPT_FALLBACK_COMPLETO } from "./prompts/fallbackCompleto.prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class InterpretadorGemini {

  static async interpretarMensagem(mensagem: string, contexto: any = {}) {

    // 1️⃣ CLASSIFICADOR DE DOMÍNIO (BARATÍSSIMO)
    const dominioResposta = await modelo.generateContent(
      CLASSIFICADOR_DOMINIO_PROMPT(mensagem)
    );

    let dominio = "outro";

    try {
      dominio = JSON.parse(
        dominioResposta.response.text().trim()
      ).dominio;
    } catch {
      dominio = "outro";
    }

    // 2️⃣ ESCOLHA DO PROMPT ESPECÍFICO
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

    // 3️⃣ CHAMADA PRINCIPAL (PROMPT MENOR E DIRECIONADO)
    const resposta = await modelo.generateContent(promptFinal);

    let texto = resposta.response.text().trim();

    // 4️⃣ LIMPEZA DEFENSIVA (MANTÉM SEU PADRÃO)
    texto = texto
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/\\n/g, "\n")
      .trim();

    const match = texto.match(/(\[|\{)[\s\S]*$/);
    if (match) {
      texto = match[0];
    }

    // 5️⃣ PARSE FINAL
    try {
      return JSON.parse(texto);
    } catch (e) {
      console.error("Erro ao interpretar JSON da IA:", texto);
      return [{ acao: "desconhecido" }];
    }
  }
}
