import { AssistenteFinanceiro } from "../core/assistenteFinanceiro";

export class BotService {

  static async processarMensagem(telefone: string, mensagem: string) {
    // ✔️ Se for autorizado, processa normalmente
    return AssistenteFinanceiro.processar(telefone, mensagem);
  }
}
