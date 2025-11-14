import { PrismaClient, Transacao, TipoTransacao, StatusTransacao, Frequencia } from "@prisma/client";

const prisma = new PrismaClient();

export class TransacaoRepository {

    // 👉 Criar transação
    static async criar(dados: {
        usuarioId: string;
        categoriaId?: string | null;
        tipo: TipoTransacao;
        valor: number;
        descricao?: string;
        data?: Date;
        dataAgendada?: Date | null;
        status?: StatusTransacao;
        recorrente?: boolean;
    }): Promise<Transacao> {
        return prisma.transacao.create({
            data: {
                usuarioId: dados.usuarioId,
                categoriaId: dados.categoriaId ?? null,
                tipo: dados.tipo,
                valor: dados.valor,
                descricao: dados.descricao ?? null,
                data: dados.data ?? new Date(),
                dataAgendada: dados.dataAgendada ?? null,
                status: dados.status ?? "concluida",
                recorrente: dados.recorrente ?? false,
            },
        });
    }

    // 👉 Buscar por ID
    static async buscarPorId(id: string): Promise<Transacao | null> {
        return prisma.transacao.findUnique({
            where: { id },
        });
    }

    // 👉 Buscar transações para edição/exclusão (últimas 10)
    static async listarRecentes(usuarioId: string): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: { usuarioId },
            orderBy: { criadoEm: "desc" },
            take: 10,
        });
    }

    // 👉 Listar tudo do usuário
    static async listarPorUsuario(usuarioId: string): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: { usuarioId },
            orderBy: { data: "desc" },
        });
    }

    // 👉 Listar por tipo
    static async listarPorTipo(usuarioId: string, tipo: TipoTransacao): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: { usuarioId, tipo },
            orderBy: { data: "desc" },
        });
    }

    // 👉 Filtros gerais
    static async filtrar(params: {
        usuarioId: string;
        tipo?: TipoTransacao;
        categoriaId?: string;
        status?: StatusTransacao;
        dataInicio?: Date;
        dataFim?: Date;
    }): Promise<Transacao[]> {
        return prisma.transacao.findMany({
            where: {
                usuarioId: params.usuarioId,
                tipo: params.tipo,
                categoriaId: params.categoriaId,
                status: params.status,
                data: params.dataInicio && params.dataFim ? {
                    gte: params.dataInicio,
                    lte: params.dataFim
                } : undefined
            }
        });
    }

    // 👉 Somatório
    static async somarPorTipo(usuarioId: string, tipo: TipoTransacao): Promise<number> {
        const resultado = await prisma.transacao.aggregate({
            where: { usuarioId, tipo },
            _sum: { valor: true },
        });
        return Number(resultado._sum.valor ?? 0);
    }

    // 👉 Extrato completo
    static async extrato(usuarioId: string) {
        const receitas = await this.somarPorTipo(usuarioId, "receita");
        const despesas = await this.somarPorTipo(usuarioId, "despesa");
        return {
            receitas,
            despesas,
            saldo: receitas - despesas
        };
    }

    // 👉 Atualizar transação
    static async atualizar(id: string, dados: Partial<Transacao>): Promise<Transacao> {
        return prisma.transacao.update({
            where: { id },
            data: dados
        });
    }

    // 👉 Atualizar categoria
    static async atualizarCategoria(id: string, categoriaId: string | null) {
        return prisma.transacao.update({
            where: { id },
            data: { categoriaId }
        });
    }

    // 👉 Atualizar status
    static async atualizarStatus(id: string, status: StatusTransacao) {
        return prisma.transacao.update({
            where: { id },
            data: { status }
        });
    }

    // 👉 Atualizar data agendada
    static async atualizarDataAgendada(id: string, dataAgendada: Date | null) {
        return prisma.transacao.update({
            where: { id },
            data: { dataAgendada }
        });
    }

    // 👉 Excluir transação
    static async deletar(id: string) {
        return prisma.transacao.delete({ where: { id } });
    }

    // 👉 Buscar transações AGENDADAS que estão próximas
    static async buscarAgendadasAte(dataLimite: Date) {
        return prisma.transacao.findMany({
            where: {
                dataAgendada: {
                    lte: dataLimite
                },
                status: "pendente"
            }
        });
    }
}
