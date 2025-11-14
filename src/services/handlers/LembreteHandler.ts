import { LembreteRepository } from "../../repositories/lembrete.repository";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class LembreteHandler {

  static async iniciar(telefone: string) {
    await ContextoRepository.salvar(telefone, "criando_lembrete_texto");

    return EnviadorWhatsApp.enviar(
      telefone,
      "💭 O que deseja lembrar?"
    );
  }

  static async salvarTexto(telefone: string, texto: string) {
    await ContextoRepository.atualizarDados(telefone, { texto });
    await ContextoRepository.salvar(telefone, "criando_lembrete_data");

    return EnviadorWhatsApp.enviar(
      telefone,
      "📆 Quando devo te lembrar? (DD/MM/YYYY HH:MM)"
    );
  }

  static async salvarData(telefone: string, dataHoraMsg: string, usuarioId: string) {
    const data = new Date(dataHoraMsg.replace(" ", "T"));

    const ctx = await ContextoRepository.obter(telefone);
    const { texto } = JSON.parse(ctx!.dados as string);

    await LembreteRepository.criar({
      usuarioId,
      mensagem: texto,
      dataAlvo: data
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      "⏰ Lembrete criado com sucesso!"
    );
  }
}
