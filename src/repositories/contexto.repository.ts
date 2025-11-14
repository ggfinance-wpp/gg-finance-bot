import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class ContextoRepository {

  // Obter contexto já parseado
  static async obter(telefone: string) {
    const ctx = await prisma.contexto.findUnique({
      where: { telefone }
    });

    if (!ctx) return null;

    return {
      telefone: ctx.telefone,
      etapa: ctx.etapa,
      dados: ctx.dados ? JSON.parse(ctx.dados) : {},
      criadoEm: ctx.criadoEm
    };
  }

  // Salvar (overwrite)
  static async salvar(telefone: string, etapa: string, dados: any = {}) {
    return prisma.contexto.upsert({
      where: { telefone },
      create: {
        telefone,
        etapa,
        dados: JSON.stringify(dados)
      },
      update: {
        etapa,
        dados: JSON.stringify(dados)
      }
    });
  }

  // Define etapa e dados (alias)
  static async definir(telefone: string, etapa: string, dados: any = {}) {
    return this.salvar(telefone, etapa, dados);
  }

  // Atualiza apenas dados (merge)
  static async atualizarDados(telefone: string, novosDados: any) {
    const existing = await this.obter(telefone);
    const merged = { ...(existing?.dados || {}), ...novosDados };

    return prisma.contexto.update({
      where: { telefone },
      data: { dados: JSON.stringify(merged) }
    });
  }

  // Atualiza apenas etapa
  static async atualizarEtapa(telefone: string, etapa: string) {
    return prisma.contexto.update({
      where: { telefone },
      data: { etapa }
    });
  }

  // Atualiza etapa + dados (merge)
  static async avancar(telefone: string, etapa: string, novosDados: any = {}) {
    const existing = await this.obter(telefone);
    const dados = existing?.dados || {};

    return prisma.contexto.upsert({
      where: { telefone },
      create: {
        telefone,
        etapa,
        dados: JSON.stringify({ ...dados, ...novosDados })
      },
      update: {
        etapa,
        dados: JSON.stringify({ ...dados, ...novosDados })
      }
    });
  }

  // Atualizar tudo (overwrite completo)
  static async atualizar(telefone: string, etapa: string, dados: any) {
    return prisma.contexto.update({
      where: { telefone },
      data: {
        etapa,
        dados: JSON.stringify(dados)
      }
    });
  }

  // Limpar contexto
  static async limpar(telefone: string) {
    return prisma.contexto.delete({
      where: { telefone }
    }).catch(() => null);
  }
}
