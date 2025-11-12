import { Prisma, Usuario } from "@prisma/client";
import { prisma } from "../infra/prisma";

export class UsuarioRepository {
  static async buscarPorTelefone(telefone: string) {
    return prisma.usuario.findUnique({ where: { telefone } });
  }
  static async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  // ✅ aceita apenas os campos necessários pra criar o registro
  static async criar(dados: Prisma.UsuarioCreateInput): Promise<Usuario> {
    return prisma.usuario.create({ data: dados });
  }
}
