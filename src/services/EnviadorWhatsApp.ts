import { client } from "../whatsapp/bot";

export class EnviadorWhatsApp {
  static async enviar(telefone: string, mensagem: string) {
    try {
      const id = telefone.includes("@c.us") ? telefone : `${telefone}@c.us`;

      await client.sendMessage(id, mensagem);
      console.log(`📩 Enviado para ${telefone}: ${mensagem}`);
    } catch (erro) {
      console.error("❌ Erro ao enviar mensagem:", erro);
    }
  }
}
