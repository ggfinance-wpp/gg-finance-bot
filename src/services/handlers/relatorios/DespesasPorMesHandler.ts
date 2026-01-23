import { StatusTransacao } from "@prisma/client";
import { TransacaoRepository } from "../../../repositories/transacao.repository";
import { intervaloMes } from "../../../utils/periodo";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";

type DespesasPorMesArgs = {
  mes: number; // 1..12
  ano: number;
  mostrarTodas?: boolean;
  limite?: number; // default 30
};

export class DespesasPorMesHandler {
  private static readonly LIMITE_PADRAO = 30;

  static async executar(
    telefone: string,
    usuarioId: string,
    mesOuArgs: number | DespesasPorMesArgs,
    ano?: number,
    mostrarTodas: boolean = false
  ) {
    // ✅ Compatibilidade com os dois jeitos de chamar
    const args: DespesasPorMesArgs =
      typeof mesOuArgs === "number"
        ? {
            mes: mesOuArgs,
            ano: ano as number,
            mostrarTodas,
          }
        : mesOuArgs;

    const mes = args.mes;
    const anoFinal = args.ano;
    const limite = args.limite ?? this.LIMITE_PADRAO;
    const mostrar = args.mostrarTodas ?? false;

    const { inicio, fim } = intervaloMes(mes, anoFinal);

    const despesas = await TransacaoRepository.filtrar({
      usuarioId,
      tipo: "despesa",
      status: StatusTransacao.concluida,
      dataInicio: inicio,
      dataFim: fim,
    });

    const mesFmt = String(mes).padStart(2, "0");

    if (!despesas.length) {
      await EnviadorWhatsApp.enviar(
        telefone,
        `💸 Não encontrei despesas registradas para ${mesFmt}/${anoFinal}.`
      );
      return;
    }

    const formatar = (valor: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(valor);

    const total = despesas.reduce((acc, d) => acc + Number(d.valor), 0);

    const lista = mostrar ? despesas : despesas.slice(0, limite);

    const linhas = lista.map((d) => {
      const data = d.data ? new Date(d.data).toLocaleDateString("pt-BR") : "-";
      const desc = d.descricao ?? "Sem descrição";
      return `• ${data} - ${desc}: ${formatar(Number(d.valor))}`;
    });

    const textoLimite = mostrar
      ? ""
      : `\n\n_(mostrando as ${lista.length} mais recentes)_`;

    const mensagem =
      `💸 *Despesas de ${mesFmt}/${anoFinal}*\n\n` +
      linhas.join("\n") +
      `\n\n💰 *Total do mês:* ${formatar(total)}` +
      textoLimite;

    await EnviadorWhatsApp.enviar(telefone, mensagem);
  }
}
