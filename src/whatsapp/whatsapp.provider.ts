export class WhatsappProvider {
  static async sendMessage(to: string, message: string) {
    console.log(`📤 Enviando para ${to}: ${message}`);

    // Aqui depois você conecta com Baileys ou Evolution API
  }
}
