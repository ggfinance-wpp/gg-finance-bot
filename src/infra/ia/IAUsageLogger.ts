import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "ia-usage.txt");

// 💱 taxa fixa (pode virar env depois)
const USD_TO_BRL = 5.0;

export class IAUsageLogger {
  static log(data: {
    usuarioId?: string;
    etapa: "classificador" | "principal";
    model: string;
    promptChars: number;
    respostaChars: number;
    tokensEntrada: number;
    tokensSaida: number;
    geminiUSD: number;
    gptUSD: number;
  }) {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const geminiBRL = data.geminiUSD * USD_TO_BRL;
    const gptBRL = data.gptUSD * USD_TO_BRL;

    const linha = [
      new Date().toISOString(),
      `user=${data.usuarioId ?? "anon"}`,
      `etapa=${data.etapa}`,
      `model=${data.model}`,
      `promptChars=${data.promptChars}`,
      `respostaChars=${data.respostaChars}`,
      `tokensIn=${data.tokensEntrada}`,
      `tokensOut=${data.tokensSaida}`,
      `geminiUSD=${data.geminiUSD.toFixed(6)}`,
      `geminiBRL=R$${geminiBRL.toFixed(4)}`,
      `gptUSD=${data.gptUSD.toFixed(6)}`,
      `gptBRL=R$${gptBRL.toFixed(4)}`
    ].join(" | ");

    fs.appendFileSync(LOG_FILE, linha + "\n");
  }
}
