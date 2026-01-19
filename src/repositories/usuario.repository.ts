import { Prisma, Usuario } from "@prisma/client";
import { prisma } from "../infra/prisma";

export class UsuarioRepository {
  static async buscarPorTelefone(telefone: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { telefone } });
  }
  // 🔑 BUSCA PRINCIPAL (NOVO PADRÃO)
  static async buscarPorUserId(userId: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { userId }
    });
  }

  static async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  // Aceita o input de criação do Prisma
  static async criar(dados: Prisma.UsuarioCreateInput): Promise<Usuario> {
    return prisma.usuario.create({ data: dados });
  }
}
