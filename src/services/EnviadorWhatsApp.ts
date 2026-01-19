import { client } from "../whatsapp/bot";

export class EnviadorWhatsApp {
  static async enviar(destino: string, mensagem: string) {
    try {
      // 1️⃣ tenta resolver o chat (funciona com @lid)
      const chat = await client.getChatById(destino);
      await chat.sendMessage(mensagem);
      return;
    } catch (error) {
      // 2️⃣ fallback seguro (último recurso)
      try {
        await client.sendMessage(destino, mensagem);
      } catch (err) {
        console.error("❌ Falha definitiva ao enviar mensagem:", err);
      }
    }
  }
}
