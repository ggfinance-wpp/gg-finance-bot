import { Contexto } from "@prisma/client";
import { prisma } from "../infra/prisma";

export type ContextoDados = Record<string, unknown>;

export interface ContextoView {
  telefone: string;
  etapa: string;
  dados: ContextoDados;
  criadoEm: Date;
}

export class ContextoRepository {
  // Obter contexto já parseado
  static async obter(telefone: string): Promise<ContextoView | null> {
    const ctx = await prisma.contexto.findUnique({
      where: { telefone },
    });

    if (!ctx) return null;

    let dados: ContextoDados = {};
    if (ctx.dados) {
      try {
        dados = JSON.parse(ctx.dados) as ContextoDados;
      } catch {
        dados = {};
      }
    }

    return {
      telefone: ctx.telefone,
      etapa: ctx.etapa,
      dados,
      criadoEm: ctx.criadoEm,
    };
  }

  static async salvar(
    telefone: string,
    contexto: { etapa: string; dados?: ContextoDados }
  ): Promise<Contexto> {
    return prisma.contexto.upsert({
      where: { telefone },
      create: {
        telefone,
        etapa: contexto.etapa,
        dados: JSON.stringify(contexto.dados ?? {}),
      },
      update: {
        etapa: contexto.etapa,
        dados: JSON.stringify(contexto.dados ?? {}),
      },
    });
  }

  static async definir(
    telefone: string,
    etapa: string,
    dados: ContextoDados = {}
  ): Promise<Contexto> {
    return this.salvar(telefone, { etapa, dados });
  }

  static async atualizarDados(
    telefone: string,
    novosDados: ContextoDados
  ): Promise<Contexto> {
    const existing = await this.obter(telefone);
    const merged: ContextoDados = { ...(existing?.dados || {}), ...novosDados };

    return prisma.contexto.update({
      where: { telefone },
      data: { dados: JSON.stringify(merged) },
    });
  }

  static async atualizarEtapa(
    telefone: string,
    etapa: string
  ): Promise<Contexto> {
    return prisma.contexto.update({
      where: { telefone },
      data: { etapa },
    });
  }

  static async avancar(
    telefone: string,
    etapa: string,
    novosDados: ContextoDados = {}
  ): Promise<Contexto> {
    const existing = await this.obter(telefone);
    const dadosBase = existing?.dados || {};

    return prisma.contexto.upsert({
      where: { telefone },
      create: {
        telefone,
        etapa,
        dados: JSON.stringify({ ...dadosBase, ...novosDados }),
      },
      update: {
        etapa,
        dados: JSON.stringify({ ...dadosBase, ...novosDados }),
      },
    });
  }

  static async atualizar(
    telefone: string,
    etapa: string,
    dados: ContextoDados
  ): Promise<Contexto> {
    return prisma.contexto.update({
      where: { telefone },
      data: {
        etapa,
        dados: JSON.stringify(dados),
      },
    });
  }

  static async limpar(telefone: string): Promise<Contexto | null> {
    const existe = await prisma.contexto.findUnique({
      where: { telefone },
    });

    if (!existe) {
      return null;
    }

    return prisma.contexto.delete({
      where: { telefone },
    });
  }

}
