import { PrismaClient, Transacao, TipoTransacao } from "@prisma/client";

const prisma = new PrismaClient();

export class TransacaoRepository {
    static async criar(dados: {
        usuarioId: string;
        categoriaId?: string;
        tipo: TipoTransacao;
        valor: number;
        descricao?: string;
        data?: Date;
        recorrente?: boolean;
    }): Promise<Transacao> {
        return prisma.transacao.create({
            data: {
                ...dados,
                data: dados.data ?? new Date(),
                recorrente: dados.recorrente ?? false,
            },
        });
    }

    static async listarPorUsuario(usuarioId: string): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: { usuarioId },
            orderBy: { data: "desc" },
        });
    }

    static async listarPorTipo(usuarioId: string, tipo: TipoTransacao): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: { usuarioId, tipo },
            orderBy: { data: "desc" },
        });
    }

    static async somarPorTipo(usuarioId: string, tipo: TipoTransacao): Promise<number> {
        const resultado = await prisma.transacao.aggregate({
            where: { usuarioId, tipo },
            _sum: { valor: true },
        });

        return Number(resultado._sum.valor ?? 0);
    }

    static async extrato(usuarioId: string) {
        const receitas = await this.somarPorTipo(usuarioId, "receita");
        const despesas = await this.somarPorTipo(usuarioId, "despesa");
        const saldo = receitas - despesas;

        return { receitas, despesas, saldo };
    }

    static async deletar(id: string) {
        return prisma.transacao.delete({ where: { id } });
    }
}
