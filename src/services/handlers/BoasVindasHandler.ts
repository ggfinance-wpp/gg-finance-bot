import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class BoasVindasHandler {
  static async executar(telefone: string) {
    const menu = `
👋 Olá, bem-vindo ao *GG Finance* 💰

Selecione uma opção digitando o número:

1️⃣ Cadastrar usuário
2️⃣ Registrar receita  (Ex: 2 1500)
3️⃣ Registrar despesa  (Ex: 3 400)
4️⃣ Ver relatório financeiro
5️⃣ Ver meu perfil
    `;

    await EnviadorWhatsApp.enviar(telefone, menu);
  }
}
