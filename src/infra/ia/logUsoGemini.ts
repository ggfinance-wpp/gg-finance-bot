import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "gemini-usage.txt");

function estimarTokens(texto: string) {
  return Math.ceil(texto.length / 4);
}

export function logUsoGemini(data: {
  etapa: "classificador" | "principal";
  prompt: string;
  resposta: string;
  model: string;
  usuarioId?: string;
}) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const tokensIn = estimarTokens(data.prompt);
  const tokensOut = estimarTokens(data.resposta);

  const linha = [
    new Date().toISOString(),
    `user=${data.usuarioId ?? "anon"}`,
    `etapa=${data.etapa}`,
    `model=${data.model}`,
    `promptChars=${data.prompt.length}`,
    `respostaChars=${data.resposta.length}`,
    `tokensIn=${tokensIn}`,
    `tokensOut=${tokensOut}`
  ].join(" | ");

  fs.appendFileSync(LOG_FILE, linha + "\n");
}
