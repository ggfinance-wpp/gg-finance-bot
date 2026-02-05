import { TransacaoRepository } from "../../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";

type ListarReceitasArgs = {
  porMes?: boolean;
  mes?: number;
  ano?: number;
  limite?: number;        // default 20
  mostrarTodas?: boolean;
};

type TransacaoComCategoria = Awaited<
  ReturnType<typeof TransacaoRepository.listarDetalhadoPorTipo>
>[number];

export class ListarReceitasHandler {
  private static readonly LIMITE_PADRAO = 20;

  private static obterMesAnoAtual() {
    const hoje = new Date();
    return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
  }

  static async executar(
    telefone: string,
    usuarioId: string,
    args?: ListarReceitasArgs | boolean
  ) {

    const mostrarTodas =
      typeof args === "boolean" ? args : (args?.mostrarTodas ?? false);

    const porMes =
      typeof args === "boolean" ? false : (args?.porMes ?? false);

    const limite =
      typeof args === "boolean" ? this.LIMITE_PADRAO : (args?.limite ?? this.LIMITE_PADRAO);


    if (porMes) {
      const alvo =
        typeof args !== "boolean" && args?.mes && args?.ano
          ? { mes: args.mes, ano: args.ano }
          : this.obterMesAnoAtual();

      const { ReceitasPorMesHandler } = await require(
        "../relatorios/ReceitasPorMesHandler"
      );

      await ReceitasPorMesHandler.executar(telefone, usuarioId, {
        mes: alvo.mes,
        ano: alvo.ano,
        limite,
        mostrarTodas,
      });

      return;
    }

    const receitas: TransacaoComCategoria[] =
      await TransacaoRepository.listarDetalhadoPorTipo(usuarioId, "receita");

    if (!receitas?.length) {
      await EnviadorWhatsApp.enviar(
        telefone,
        "📈 Você ainda não tem receitas registradas."
      );
      return;
    }

    const titulo = "📈 *Suas receitas registradas*";

    const lista = mostrarTodas ? receitas : receitas.slice(0, limite);

    const linhas = lista.map((r) => {
      const data = r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-";
      const desc = r.descricao ?? "Sem descrição";
      const categoria = r.categoria?.nome ?? "Sem categoria";
      return `• ${data} - ${desc} (${categoria}): ${(Number(r.valor))}`;
    });

    const total = receitas.reduce((acc, r) => acc + Number(r.valor), 0);

    const textoLimite = mostrarTodas
      ? ""
      : `\n\n_(mostrando as ${lista.length} mais recentes)_`;

    const mensagem =
      `${titulo}\n\n` +
      linhas.join("\n") +
      `\n\n💰 *Total:* ${(total)}` +
      textoLimite;

    await EnviadorWhatsApp.enviar(telefone, mensagem);
  }
}
