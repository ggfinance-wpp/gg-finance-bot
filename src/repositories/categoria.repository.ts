import { PrismaClient, Categoria, TipoTransacao } from "@prisma/client";

const prisma = new PrismaClient();

export class CategoriaRepository {

    // 👉 Criar categoria
    static async criar(dados: {
        usuarioId: string;
        nome: string;
        tipo: TipoTransacao;
        icone?: string | null;
        cor?: string | null;
    }): Promise<Categoria> {
        return prisma.categoria.create({
            data: {
                usuarioId: dados.usuarioId,
                nome: dados.nome,
                tipo: dados.tipo,
                icone: dados.icone ?? null,
                cor: dados.cor ?? null,
            },
        });
    }

    // 👉 Buscar por nome
    static async buscarPorNome(usuarioId: string, nome: string): Promise<Categoria | null> {
        return prisma.categoria.findFirst({
            where: {
                usuarioId,
                nome: nome.toLowerCase()
            },
        });
    }


    // 👉 Buscar por ID
    static async buscarPorId(id: string): Promise<Categoria | null> {
        return prisma.categoria.findUnique({
            where: { id }
        });
    }

    // 👉 Listar categorias do usuário
    static async listarDoUsuario(usuarioId: string) {
        return prisma.categoria.findMany({
            where: { usuarioId },
            orderBy: { criadoEm: "desc" }
        });
    }

    // 👉 Excluir categoria
    static async deletar(id: string) {
        return prisma.categoria.delete({ where: { id } });
    }

    // 👉 Editar categoria
    static async atualizar(id: string, dados: Partial<Categoria>) {
        return prisma.categoria.update({
            where: { id },
            data: dados
        });
    }
}
