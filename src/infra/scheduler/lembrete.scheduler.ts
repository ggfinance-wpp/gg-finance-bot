import { LembreteRepository } from "../../repositories/lembrete.repository";
import { EnviadorWhatsApp } from "../../services/EnviadorWhatsApp";

export class LembreteScheduler {

  static async executar() {
    const agora = new Date();

    const lembretes = await LembreteRepository.buscarPendentesAte(agora);

    for (const lembrete of lembretes) {
      await EnviadorWhatsApp.enviar(
        lembrete.usuario.telefone,
        `⏰ *Lembrete*\n\n${lembrete.mensagem}${
          lembrete.valor ? `\n💰 Valor: R$ ${lembrete.valor.toFixed(2)}` : ""
        }`
      );

      await LembreteRepository.marcarComoEnviado(lembrete.id);
    }
  }
}
