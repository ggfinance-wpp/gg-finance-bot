import { LembreteRepository } from "../../../repositories/lembrete.repository";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";

type ListarLembretesArgs = {
  porMes?: boolean;
  mes?: number;
  ano?: number;
  limite?: number; // default 20
};

export class ListarLembretesHandler {
  private static readonly LIMITE_PADRAO = 20;

  private static formatarValor(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(valor);
  }

  private static obterMesAnoAtual() {
    const hoje = new Date();
    return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
  }

  static async executar(
    telefone: string,
    usuarioId: string,
    args?: ListarLembretesArgs
  ) {
    try {
      const porMes = args?.porMes ?? false;
      const limite = args?.limite ?? this.LIMITE_PADRAO;

      // ✅ POR MÊS -> delega sem mudar lógica (mesmos defaults)
      if (porMes) {
        const alvo =
          args?.mes && args?.ano
            ? { mes: args.mes, ano: args.ano }
            : this.obterMesAnoAtual();

        const { LembretesPorMesHandler } = await require(
          "../relatorios/LembretesPorMesHandler"
        );

        await LembretesPorMesHandler.executar(telefone, usuarioId, {
          mes: alvo.mes,
          ano: alvo.ano,
          limite,
        });

        return;
      }

      // ✅ modo "só lista" (igual ao teu atual)
      let lembretes = (await LembreteRepository.listarFuturos(usuarioId)) ?? [];
      const titulo = "📋 *Seus lembretes futuros*";

      // ✅ limite padrão (mesma lógica)
      if (Array.isArray(lembretes) && limite > 0) {
        lembretes = lembretes.slice(0, limite);
      }

      if (!Array.isArray(lembretes) || lembretes.length === 0) {
        await EnviadorWhatsApp.enviar(
          telefone,
          "⚠️ Você não tem lembretes futuros."
        );
        return;
      }

      const linhas = lembretes.map((l, idx) => {
        const data = l.dataAlvo
          ? new Date(l.dataAlvo).toLocaleDateString("pt-BR")
          : "-";

        const numValor = l.valor != null ? Number(l.valor) : null;
        const valor =
          numValor != null && !Number.isNaN(numValor)
            ? ` (${this.formatarValor(numValor)})`
            : "";

        return `${idx + 1}) ${data} - ${l.mensagem}${valor}`;
      });

      const mensagem = `${titulo}\n\n${linhas.join("\n")}`;
      await EnviadorWhatsApp.enviar(telefone, mensagem);
    } catch (err: any) {
      console.error("[ListarLembretes] ERRO REAL:", err?.message);
      console.error(err?.stack ?? err);

      await EnviadorWhatsApp.enviar(
        telefone,
        "❌ Ocorreu um erro ao listar seus lembretes. (erro interno registrado)"
      );
    }
  }
}
