import { ContextoRepository } from "../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { TransacaoRepository } from "../../repositories/transacao.repository";

export class AgendamentoHandler {

  static async pedirData(telefone: string) {
    await ContextoRepository.salvar(telefone, { etapa: "informar_data_agendada" });

    return EnviadorWhatsApp.enviar(
      telefone,
      "📅 Quando deseja agendar?\nExemplo: 25/02/2025"
    );
  }

  static async salvarData(telefone: string, dataTexto: string, usuarioId: string) {
    const partes = dataTexto.split("/");
    if (partes.length !== 3) {
      return EnviadorWhatsApp.enviar(telefone, "Data inválida. Use DD/MM/YYYY");
    }

    const data = new Date(
      Number(partes[2]),
      Number(partes[1]) - 1,
      Number(partes[0])
    );

    const ctx = await ContextoRepository.obter(telefone);
    if (!ctx) {
      return EnviadorWhatsApp.enviar(telefone, "⚠ Nenhum dado encontrado.");
    }

    const dados = ctx.dados as {
      tipo: "receita" | "despesa";
      valor: number;
      descricao?: string;
    };

    await TransacaoRepository.criar({
      usuarioId,
      tipo: dados.tipo,
      valor: dados.valor,
      descricao: dados.descricao,
      data,
      dataAgendada: data,
      status: "pendente"
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `📌 Agendado para *${dataTexto}* com sucesso!`
    );
  }
}
