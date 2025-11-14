import { TransacaoRepository } from "../../repositories/transacao.repository";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class ExcluirTransacaoHandler {

  static async iniciar(telefone: string) {
    await ContextoRepository.salvar(telefone, "excluir_transacao_id");

    return EnviadorWhatsApp.enviar(
      telefone,
      "🗑 Envie o ID da transação que deseja excluir."
    );
  }

  static async confirmar(telefone: string, id: string) {
    await ContextoRepository.salvar(telefone, "confirmar_exclusao", { id });

    return EnviadorWhatsApp.enviar(
      telefone,
      `⚠ Tem certeza que deseja excluir?\nID: ${id}\n\nResponda *sim* ou *não*.`
    );
  }

  static async executar(telefone: string, confirmacao: string) {
    const ctx = await ContextoRepository.obter(telefone);
    const { id } = JSON.parse(ctx!.dados as string);

    if (!confirmacao.toLowerCase().startsWith("s")) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "Operação cancelada.");
    }

    await TransacaoRepository.deletar(id);
    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(telefone, "🗑 Transação excluída com sucesso!");
  }
}
