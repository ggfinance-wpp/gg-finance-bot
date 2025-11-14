import { AssistenteFinanceiro } from "../core/assistenteFinanceiro";

export class BotService {

  static async processarMensagem(telefone: string, mensagem: string) {

    // 🔒 Número autorizado (COLOQUE O SEU)
    const numeroAutorizado = "558598500014"; // <- seu número aqui

    // ❌ Se NÃO for o número autorizado → simplesmente ignora
    if (telefone !== numeroAutorizado) {
      console.log(`Ignorando mensagem de número não autorizado: ${telefone}`);
      return; // <--- Nenhuma resposta, nenhuma ação
    }

    // ✔️ Se for autorizado, processa normalmente
    return AssistenteFinanceiro.processar(telefone, mensagem);
  }
}
