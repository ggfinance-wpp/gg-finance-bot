import crypto from "crypto";
import { env } from "../config/env";

/**
 * 🧼 Remove caracteres potencialmente perigosos e espaços desnecessários.
 */
export function sanitizeInput(texto: string): string {
  if (!texto) return "";
  return texto.replace(/[<>$\\]/g, "").trim();
}

/**
 * 📞 Mascara um telefone antes de logar ou exibir.
 * Exemplo: +5511999998888 → +55********8888
 */
export function mascararTelefone(telefone: string): string {
  if (!telefone) return "";
  return telefone.replace(/(\+\d{2})\d+(?=\d{4})/, "$1********");
}

export function validarCpfCnpj(valor: string): boolean {
  return /^\d{11}$|^\d{14}$/.test(valor); // 11 (CPF) ou 14 (CNPJ)
}

/**
 * 💰 Valida se o valor financeiro informado é seguro e aceitável.
 */
export function validarValorTransacao(valor: number): boolean {
  if (isNaN(valor)) return false;
  if (valor <= 0) return false;
  if (valor > 1000000) return false; // limite de segurança
  return true;
}

/**
 * 🔏 Verifica a assinatura HMAC de webhooks.
 * Garante que o payload não foi interceptado ou adulterado.
 */
export function validarAssinaturaWebhook(reqBody: any, assinaturaRecebida?: string) {
  if (!assinaturaRecebida) throw new Error("Assinatura ausente");

  const corpo = JSON.stringify(reqBody);
  const assinaturaCalculada = crypto
    .createHmac("sha256", env.WEBHOOK_SECRET)
    .update(corpo)
    .digest("hex");

  if (assinaturaCalculada !== assinaturaRecebida) {
    throw new Error("Assinatura inválida");
  }
}
