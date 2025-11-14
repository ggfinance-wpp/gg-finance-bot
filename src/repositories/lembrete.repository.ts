import { PrismaClient, Lembrete } from "@prisma/client";

const prisma = new PrismaClient();

export class LembreteRepository {

    // 🟢 Criar lembrete
    static async criar(dados: {
        usuarioId: string;
        mensagem: string;
        dataAlvo: Date;
    }): Promise<Lembrete> {
        return prisma.lembrete.create({
            data: {
                usuarioId: dados.usuarioId,
                mensagem: dados.mensagem,
                dataAlvo: dados.dataAlvo,
                enviado: false,
            },
        });
    }

    // 🟡 Buscar lembrete por ID
    static async buscarPorId(id: string): Promise<Lembrete | null> {
        return prisma.lembrete.findUnique({
            where: { id },
        });
    }

    // 🟣 Listar lembretes de um usuário
    static async listarPorUsuario(usuarioId: string): Promise<Lembrete[]> {
        return prisma.lembrete.findMany({
            where: { usuarioId },
            orderBy: { dataAlvo: "asc" },
        });
    }

    // 🔵 Listar lembretes não enviados com data vencida
    static async listarPendentes(): Promise<Lembrete[]> {
        return prisma.lembrete.findMany({
            where: {
                enviado: false,
                dataAlvo: { lte: new Date() },
            },
            orderBy: { dataAlvo: "asc" },
        });
    }

    // 🟠 Marcar lembrete como enviado
    static async marcarComoEnviado(id: string): Promise<Lembrete> {
        return prisma.lembrete.update({
            where: { id },
            data: { enviado: true },
        });
    }

    // 🟤 Atualizar lembrete
    static async atualizar(id: string, dados: Partial<Lembrete>): Promise<Lembrete> {
        return prisma.lembrete.update({
            where: { id },
            data: dados,
        });
    }

    // 🔴 Deletar lembrete
    static async deletar(id: string): Promise<Lembrete> {
        return prisma.lembrete.delete({
            where: { id },
        });
    }
}
