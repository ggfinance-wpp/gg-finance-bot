import { logger } from "../utils/logger";
import { client } from "../whatsapp/bot";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class EnviadorWhatsApp {
  static async enviar(destino: string, mensagem: string) {
    try {
      const chat = await client.getChatById(destino);
      logger.info(`Mensagem respondida:\n${mensagem}`);
      await chat.sendMessage(mensagem);
    } catch (error) {
      console.error("❌ Falha definitiva ao enviar mensagem:", error);
    }
  }
}

