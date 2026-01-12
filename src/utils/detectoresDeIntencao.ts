import { extrairMesEAno } from "../utils/periodo";

export type DetectorContexto = {
  telefone: string;
  usuarioId: string;
  mensagem: string;
  mensagemNormalizada: string;
};

export type Detector = {
  nome: string;
  match: (ctx: DetectorContexto) => boolean;
  executar: (ctx: DetectorContexto) => Promise<void>;
};

/**
 * IMPORTANTE:
 * - Ordem importa
 * - Do mais específico → mais genérico
 */
export const detectores: Detector[] = [
  // ===============================
  // 📌 DESPESAS POR MÊS
  // ===============================
  {
    nome: "despesas_por_mes",
    match: ({ mensagemNormalizada, mensagem }) =>
      /\b(despesa|despesas|gasto|gastos)\b/.test(mensagemNormalizada) &&
      !!extrairMesEAno(mensagem),

    executar: async ({ telefone, usuarioId, mensagem }) => {
      const mesAno = extrairMesEAno(mensagem)!;
      const { DespesasPorMesHandler } = await require(
        "../services/handlers/DespesasPorMesHandler"
      );

      await DespesasPorMesHandler.executar(
        telefone,
        usuarioId,
        mesAno.mes,
        mesAno.ano,
        false
      );
    }
  },

  // ===============================
  // 📌 RECEITAS POR MÊS
  // ===============================
  {
    nome: "receitas_por_mes",
    match: ({ mensagemNormalizada, mensagem }) =>
      /\b(receita|receitas|entrada|entradas)\b/.test(mensagemNormalizada) &&
      !!extrairMesEAno(mensagem),

    executar: async ({ telefone, usuarioId, mensagem }) => {
      const mesAno = extrairMesEAno(mensagem)!;
      const { ReceitasPorMesHandler } = await require(
        "../services/handlers/ReceitasPorMesHandler"
      );

      await ReceitasPorMesHandler.executar(
        telefone,
        usuarioId,
        mesAno.mes,
        mesAno.ano,
        false
      );
    }
  },

  // ===============================
  // 📌 LISTAR DESPESAS (GERAL)
  // ===============================
  {
    nome: "listar_despesas",
    match: ({ mensagemNormalizada }) =>
      /\b(despesas|gastos)\b/.test(mensagemNormalizada) &&
      /(ver|listar|mostrar|visualizar)?/.test(mensagemNormalizada),

    executar: async ({ telefone, usuarioId }) => {
      const { ListarDespesasHandler } = await require(
        "../services/handlers/ListarDespesaHandler"
      );

      await ListarDespesasHandler.executar(telefone, usuarioId, false);
    }
  },

  // ===============================
  // 📌 LISTAR RECEITAS (GERAL)
  // ===============================
  {
    nome: "listar_receitas",
    match: ({ mensagemNormalizada }) =>
      /\b(receitas|entradas)\b/.test(mensagemNormalizada) &&
      /(ver|listar|mostrar|visualizar)?/.test(mensagemNormalizada),

    executar: async ({ telefone, usuarioId }) => {
      const { ListarReceitasHandler } = await require(
        "../services/handlers/ListarReceitaHandler"
      );

      await ListarReceitasHandler.executar(telefone, usuarioId, false);
    }
  },
  // ===============================
  // 📌 LISTAR LEMBRETES (GERAL)
  // ===============================

  {
    nome: "listar_lembretes",
    match: ({ mensagemNormalizada }) =>
      /\b(lembrete|lembretes|avisos|agenda|recordatorio|recordatorios)\b/.test(mensagemNormalizada) &&
      /(quais|meus|minhas|listar|ver|mostrar|exibir|tem|tenho)/.test(mensagemNormalizada),

    executar: async ({ telefone, usuarioId }) => {
      const { ListarLembretesHandler } = require(
        "../services/handlers/ListarLembretesHandler"
      );

      await ListarLembretesHandler.executar(
        telefone,
        usuarioId
      );
    }
  },

];

