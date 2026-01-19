// bot.service.ts
import { AssistenteFinanceiro } from "../core/assistenteFinanceiro";

export class BotService {
  static async processarMensagem(userId: string, mensagem: string) {
    return AssistenteFinanceiro.processar(userId, mensagem);
  }
}
