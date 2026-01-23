import { LembreteRepository } from "../../../repositories/lembrete.repository";
import { intervaloMes } from "../../../utils/periodo";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";

type LembretesPorMesArgs = {
    mes: number; // 1..12
    ano: number;
    limite?: number; // default 20
};

export class LembretesPorMesHandler {
    private static readonly LIMITE_PADRAO = 20;

    private static formatarValor(valor: number) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 2,
        }).format(valor);
    }

    static async executar(
        telefone: string,
        usuarioId: string,
        mesOuArgs: number | LembretesPorMesArgs,
        ano?: number,
        limite?: number
    ) {
        try {
            // ✅ compatível com:
            // executar(tel, user, mes, ano, limite?)
            // executar(tel, user, { mes, ano, limite })
            const args: LembretesPorMesArgs =
                typeof mesOuArgs === "number"
                    ? {
                        mes: mesOuArgs,
                        ano: ano as number,
                        limite: limite ?? this.LIMITE_PADRAO,
                    }
                    : {
                        mes: mesOuArgs.mes,
                        ano: mesOuArgs.ano,
                        limite: mesOuArgs.limite ?? this.LIMITE_PADRAO,
                    };

            const { inicio, fim } = intervaloMes(args.mes, args.ano);

            let lembretes =
                (await LembreteRepository.listarPorPeriodo(usuarioId, inicio, fim)) ?? [];

            const mesFmt = String(args.mes).padStart(2, "0");
            const titulo = `📋 *Lembretes de ${mesFmt}/${args.ano}*`;
            const limiteFinal = args.limite ?? this.LIMITE_PADRAO;

            if (Array.isArray(lembretes) && limiteFinal > 0) {
                lembretes = lembretes.slice(0, limiteFinal);
            }
            if (!Array.isArray(lembretes) || lembretes.length === 0) {
                await EnviadorWhatsApp.enviar(
                    telefone,
                    "⚠️ Você não tem lembretes para esse mês."
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
            console.error("[LembretesPorMes] ERRO REAL:", err?.message);
            console.error(err?.stack ?? err);

            await EnviadorWhatsApp.enviar(
                telefone,
                "❌ Ocorreu um erro ao listar seus lembretes. (erro interno registrado)"
            );
        }
    }
}
