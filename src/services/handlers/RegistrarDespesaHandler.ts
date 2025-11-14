import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { validarValorTransacao } from "../../utils/seguranca.utils";
import { UsuarioRepository } from "../../repositories/usuario.repository";

export class RegistrarDespesaHandler {

  static async executar(
    telefone: string,
    usuarioId: string,
    valor: number,
    descricao?: string,
    dataAgendada?: Date | null,
    categoriaId?: string
  ) {

    const usuario = await UsuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Usuário não encontrado. Faça o cadastro enviando *1*."
      );
    }

    if (!validarValorTransacao(valor)) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Valor inválido. Digite algo como 25, 100, 350.90...\nExemplo: *300 mercado*"
      );
    }

    await TransacaoRepository.criar({
      usuarioId,
      tipo: "despesa",
      valor,
      descricao,
      categoriaId: categoriaId ?? null,
      dataAgendada,
      status: dataAgendada ? "pendente" : "concluida"
    });

    if (dataAgendada) {
      return EnviadorWhatsApp.enviar(
        telefone,
        `📅 Despesa agendada!\n💸 Valor: R$ ${valor.toFixed(2)}\n🔔 Vou te lembrar em ${dataAgendada.toLocaleDateString()}`
      );
    }

    return EnviadorWhatsApp.enviar(
      telefone,
      `💸 *Despesa registrada!*\nValor: R$ ${valor.toFixed(2)}`
    );
  }
}
