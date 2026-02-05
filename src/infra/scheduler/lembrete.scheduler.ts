import { LembreteRepository } from "../../repositories/lembrete.repository";
import { EnviadorWhatsApp } from "../../services/EnviadorWhatsApp";

export class LembreteScheduler {

  static async executar() {
    const agora = new Date();

    // ⛔ Nunca envia antes das 07:00
    if (agora.getHours() < 7) return;

    const lembretes = await LembreteRepository.buscarNaoEnviadosComUsuario();

    for (const lembrete of lembretes) {

      const momentoMinimo = this.calcularMomentoMinimo(lembrete.dataAlvo);

      if (agora < momentoMinimo) continue;

      await EnviadorWhatsApp.enviar(
        lembrete.usuario.userId,
        `⏰ *Lembrete*\n\n${lembrete.mensagem}${
          lembrete.valor
            ? `\n💰 Valor: R$ ${lembrete.valor.toFixed(2)}`
            : ""
        }`
      );

      await LembreteRepository.marcarComoEnviado(lembrete.id);
    }
  }

  private static calcularMomentoMinimo(dataAlvo: Date) {
    const inicioDoDia = new Date(dataAlvo);
    inicioDoDia.setHours(7, 0, 0, 0);
    return inicioDoDia;
  }
}
