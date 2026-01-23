import { TransacaoRepository } from "../../../repositories/transacao.repository";
import { intervaloMes } from "../../../utils/periodo";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";

type ReceitasPorMesArgs = {
  mes: number; // 1..12
  ano: number;
  limite?: number;        // default 20 (igual ao ListarReceitasHandler)
  mostrarTodas?: boolean; // default false
};

type TransacaoComCategoria = Awaited<
  ReturnType<typeof TransacaoRepository.listarDetalhadoPorTipo>
>[number];

export class ReceitasPorMesHandler {
  private static readonly LIMITE_PADRAO = 20;

  // ✅ compatível com:
  // executar(tel, user, mes, ano, mostrarTodas?)
  // executar(tel, user, { mes, ano, limite, mostrarTodas })
  static async executar(
    telefone: string,
    usuarioId: string,
    mesOuArgs: number | ReceitasPorMesArgs,
    ano?: number,
    mostrarTodas: boolean = false
  ) {
    const args: ReceitasPorMesArgs =
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

    // ✅ mesma fonte do teu ListarReceitasHandler no porMes (categoria incluída)
    const receitas: TransacaoComCategoria[] =
      await TransacaoRepository.listarDetalhadoPorTipoNoPeriodo(
        usuarioId,
        "receita",
        inicio,
        fim
      );

    if (!receitas?.length) {
      await EnviadorWhatsApp.enviar(
        telefone,
        "📈 Você não tem receitas registradas para esse mês."
      );
      return;
    }

    const mesFmt = String(mes).padStart(2, "0");
    const titulo = `📈 *Receitas de ${mesFmt}/${anoFinal}*`;

    const lista = mostrar ? receitas : receitas.slice(0, limite);

    const linhas = lista.map((r) => {
      const data = r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "-";
      const desc = r.descricao ?? "Sem descrição";
      const categoria = r.categoria?.nome ?? "Sem categoria";
      // ✅ mesma lógica: valor cru (Number) sem formatar moeda
      return `• ${data} - ${desc} (${categoria}): ${(Number(r.valor))}`;
    });

    const total = receitas.reduce((acc, r) => acc + Number(r.valor), 0);

    const textoLimite = mostrar
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
