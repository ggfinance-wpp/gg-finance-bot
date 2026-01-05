import { Frequencia } from "@prisma/client";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { prisma } from "../../infra/prisma"; // ajuste o path se precisar
import { ContextoRepository } from "../../repositories/contexto.repository";

function normalizar(txt: string) {
  return txt
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehSim(txt: string) {
  const t = normalizar(txt);
  return ["sim", "s", "confirmo", "pode", "ok", "fechado", "isso"].includes(t);
}

function ehNao(txt: string) {
  const t = normalizar(txt);
  return ["nao", "não", "n", "cancela", "cancelar", "negativo"].includes(t);
}

export class RecorrenciaHandler {
  /**
   * 1) Inicia o fluxo (salva no contexto e pede confirmação)
   */
  static async iniciarCriacao(
    telefone: string,
    usuarioId: string,
    descricao: string | null,
    valor: number | null,
    frequencia: Frequencia | null,
    diaDoMes: string | number | null
  ) {
    // validações mínimas
    if (!descricao) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não entendi o que você quer tornar recorrente. Ex: “pagar academia todo dia 10 do mês 130”"
      );
    }

    if (!frequencia) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não consegui identificar a frequência (mensal, diária, semanal...)."
      );
    }

    // se mensal, valida dia
    let dia: number | null = null;
    if (frequencia === "mensal") {
      dia = diaDoMes ? Number(diaDoMes) : null;
      if (!dia || dia < 1 || dia > 31) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "📅 Qual dia do mês? (1 a 31). Ex: “todo dia 10 do mês”"
        );
      }
    }

    // salva pendência
    await ContextoRepository.definir(telefone, "confirmar_criar_recorrencia", {
      descricao,
      valor: valor ?? 0,
      frequencia,
      diaDoMes: dia,
    });

    // mensagem de confirmação
    const resumo =
      `Beleza. Vou criar essa recorrência:\n\n` +
      `📌 *${descricao}*\n` +
      (valor !== null ? `💰 *R$ ${valor}*\n` : "") +
      `⏳ *${frequencia.toUpperCase()}*` +
      (frequencia === "mensal" ? ` (dia ${dia})` : "") +
      `\n\nConfirma? (Sim/Não)`;

    return EnviadorWhatsApp.enviar(telefone, resumo);
  }

  /**
   * 2) Confirmação (Sim/Não) usando etapa do Contexto
   */
  static async confirmarCriacao(
    telefone: string,
    usuarioId: string,
    mensagem: string,
    dados: Record<string, any>
  ) {
    if (ehNao(mensagem)) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "Tranquilo — cancelei a criação da recorrência ✅");
    }

    if (!ehSim(mensagem)) {
      return EnviadorWhatsApp.enviar(telefone, "Só pra confirmar: responde com *Sim* ou *Não* 🙂");
    }

    const descricao = (dados?.descricao as string) ?? null;
    const valor = typeof dados?.valor === "number" ? dados.valor : Number(dados?.valor ?? 0);
    const frequencia = (dados?.frequencia as Frequencia) ?? null;
    const diaDoMes = dados?.diaDoMes ?? null;

    await ContextoRepository.limpar(telefone);

    // cria de fato
    return this.criar(telefone, usuarioId, descricao, valor, frequencia, diaDoMes);
  }

  /**
   * 3) Criação real da recorrência (após confirmação)
   */
  static async criar(
    telefone: string,
    usuarioId: string,
    descricao: string | null,
    valor: number | null,
    frequencia: Frequencia | null,
    diaDoMes: string | number | null
  ) {
    if (!descricao) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não entendi o que você quer tornar recorrente. Pode repetir?"
      );
    }

    if (!frequencia) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não consegui identificar a frequência (mensal, diária, semanal...)."
      );
    }

    const valorFinal = valor ?? 0;
    const proximaCobranca = this.calcularProximaCobranca(frequencia, diaDoMes);

    // Transação base (modelo da recorrência)
    const transacao = await prisma.transacao.create({
      data: {
        usuarioId,
        descricao,
        valor: valorFinal,
        tipo: "despesa",

        data: new Date(),

        dataAgendada: proximaCobranca,

        recorrente: true,
        status: "pendente",
      }
    });


    const recorrencia = await prisma.recorrencia.create({
      data: {
        usuarioId,
        transacaoId: transacao.id,
        frequencia,
        intervalo: 1,
        proximaCobra: proximaCobranca,
      },
    });

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔁 Recorrência criada!\n\n` +
      `📌 *${descricao}*\n` +
      `💰 Valor: *R$ ${valorFinal}*\n` +
      `⏳ Frequência: *${frequencia.toUpperCase()}*\n` +
      `📆 Próxima cobrança: *${this.formatar(proximaCobranca)}*\n\n` +
      `✅ Quando chegar a data, o cron vai gerar a despesa automaticamente.`
    );
  }

  /**
   * Calcula a próxima data de cobrança (corrigido)
   */
  static calcularProximaCobranca(frequencia: Frequencia, diaDoMes: string | number | null): Date {
    const hoje = new Date();

    if (frequencia === "diaria") {
      const d = new Date(hoje);
      d.setDate(d.getDate() + 1);
      return d;
    }

    if (frequencia === "semanal") {
      const d = new Date(hoje);
      d.setDate(d.getDate() + 7);
      return d;
    }

    if (frequencia === "mensal") {
      const dia = diaDoMes ? Number(diaDoMes) : hoje.getDate();
      if (dia < 1 || dia > 31) return hoje;

      // tenta ainda neste mês
      const esteMes = new Date(hoje.getFullYear(), hoje.getMonth(), dia);

      // se já passou (ou é hoje), joga pro próximo mês
      if (esteMes <= hoje) {
        return new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
      }

      return esteMes;
    }

    // anual
    return new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate());
  }

  static formatar(data: Date): string {
    return data.toLocaleDateString("pt-BR");
  }
}
