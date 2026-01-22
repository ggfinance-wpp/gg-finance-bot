import { extrairMesEAno } from "../utils/periodo";

export type DetectorContexto = {
  userId: string;      // 🔑 identidade do chat
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
  // 📌  LISTAR DESPESAS (Por mês)
  // ===============================
  {
    nome: "despesas_por_mes",
    match: ({ mensagemNormalizada, mensagem }) =>
      /\b(despesa|despesas|gasto|gastos)\b/.test(mensagemNormalizada) &&
      !!extrairMesEAno(mensagem),

    executar: async ({ userId, usuarioId, mensagem }) => {
      const mesAno = extrairMesEAno(mensagem)!;

      const { DespesasPorMesHandler } = await require(
        "../services/handlers/relatorios/DespesasPorMesHandler"
      );

      await DespesasPorMesHandler.executar(userId, usuarioId, {
        mes: mesAno.mes,
        ano: mesAno.ano,
      });
    },
  },

  // ===============================
  // 📌  LISTAR DESPESAS (Geral)
  // ===============================
  {
    nome: "listar_despesas",
    match: ({ mensagemNormalizada }) =>
      /\b(despesas|gastos)\b/.test(mensagemNormalizada) &&
      /(ver|listar|mostrar|visualizar)?/.test(mensagemNormalizada),

    executar: async ({ userId, usuarioId }) => {
      const { ListarDespesasHandler } = await require(
        "../services/handlers/financeiro/ListarDespesaHandler"
      );

      await ListarDespesasHandler.executar(userId, usuarioId, false);
    },
  },

  // ===============================
  // 📌 LISTAR RECEITAS (Por mês)
  // ===============================
  {
    nome: "receitas_por_mes",
    match: ({ mensagemNormalizada, mensagem }) =>
      /\b(receita|receitas|entrada|entradas)\b/.test(mensagemNormalizada) &&
      !!extrairMesEAno(mensagem),

    executar: async ({ userId, usuarioId, mensagem }) => {
      const mesAno = extrairMesEAno(mensagem)!;

      const { ReceitasPorMesHandler } = await require(
        "../services/handlers/relatorios/ReceitasPorMesHandler"
      );

      await ReceitasPorMesHandler.executar(userId, usuarioId, {
        mes: mesAno.mes,
        ano: mesAno.ano,
      });
    },
  },

  // ===============================
  // 📌 LISTAR RECEITAS (Geral)
  // ===============================
  {
    nome: "listar_receitas",
    match: ({ mensagemNormalizada }) =>
      /\b(receitas|entradas)\b/.test(mensagemNormalizada) &&
      /(ver|listar|mostrar|visualizar)?/.test(mensagemNormalizada),

    executar: async ({ userId, usuarioId }) => {
      const { ListarReceitasHandler } = await require(
        "../services/handlers/financeiro/ListarReceitaHandler"
      );

      await ListarReceitasHandler.executar(userId, usuarioId, false);
    },
  },

  // ===============================
  // 📌 LISTAR LEMBRETES (Por mês)
  // ===============================
  {
    nome: "lembretes_por_mes",
    match: ({ mensagemNormalizada, mensagem }) =>
      /\b(lembrete|lembretes|avisos|agenda|recordatorio|recordatorios)\b/.test(
        mensagemNormalizada
      ) && !!extrairMesEAno(mensagem),

    executar: async ({ userId, usuarioId, mensagem }) => {
      const mesAno = extrairMesEAno(mensagem)!;

      const { LembretesPorMesHandler } = await require(
        "../services/handlers/relatorios/LembretesPorMesHandler"
      );

      await LembretesPorMesHandler.executar(userId, usuarioId, {
        mes: mesAno.mes,
        ano: mesAno.ano,
      });
    },
  },

  // ===============================
  // 📌 LISTAR LEMBRETES (Geral)
  // ===============================
  {
    nome: "listar_lembretes",
    match: ({ mensagemNormalizada }) =>
      /\b(lembrete|lembretes|avisos|agenda|recordatorio|recordatorios)\b/.test(
        mensagemNormalizada
      ) &&
      /(quais|meus|minhas|listar|ver|mostrar|exibir|tem|tenho)/.test(
        mensagemNormalizada
      ),

    executar: async ({ userId, usuarioId }) => {
      const { ListarLembretesHandler } = await require(
        "../services/handlers/lembrete/ListarLembretesHandler"
      );

      await ListarLembretesHandler.executar(userId, usuarioId);
    },
  },
];
