// services/handlers/LembreteHandler.ts
import { LembreteRepository } from "../../repositories/lembrete.repository";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class LembreteHandler {

  // Agora ele aceita mensagem + data opcionais vindas da IA
  static async iniciar(
    telefone: string,
    usuarioId: string,
    mensagemIA?: string | null,
    dataIA?: string | null
  ) {
    // ✅ Caso 1: IA já entendeu mensagem + data → tenta criar direto
    if (mensagemIA && dataIA) {
      const data = parseDataPtBr(dataIA);

      if (data) {
        await LembreteRepository.criar({
          usuarioId,
          mensagem: mensagemIA,
          dataAlvo: data
        });

        return EnviadorWhatsApp.enviar(
          telefone,
          "⏰ Lembrete criado com sucesso!\n\n" +
          `📝 ${mensagemIA}\n` +
          `📅 Data: ${data.toLocaleDateString("pt-BR")}`
        );
      }

      // Se a data vier num formato estranho, avisa e cai pro fluxo guiado
      await EnviadorWhatsApp.enviar(
        telefone,
        "📆 Entendi o lembrete, mas não consegui interpretar a data.\n" +
        "Vou te perguntar direitinho agora pra garantir, beleza?"
      );
    }

    // ✅ Caso 2: IA não trouxe tudo → entra no fluxo passo a passo
    await ContextoRepository.salvar(telefone, "criando_lembrete_texto");

    return EnviadorWhatsApp.enviar(
      telefone,
      "💭 O que você quer que eu te lembre?\n\n" +
      "Exemplo: *pagar a faculdade de 280 reais*"
    );
  }

  // 1ª etapa do fluxo manual: texto do lembrete
  static async salvarTexto(telefone: string, texto: string) {
    await ContextoRepository.atualizarDados(telefone, { texto });
    await ContextoRepository.salvar(telefone, "criando_lembrete_data");

    return EnviadorWhatsApp.enviar(
      telefone,
      "📆 Quando devo te lembrar? (ex: 20/11/2025 ou 20/11)"
    );
  }

  // 2ª etapa do fluxo manual: data do lembrete
  static async salvarData(telefone: string, dataHoraMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);

    if (!ctx || !ctx.dados) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Não encontrei o texto do lembrete.\n" +
        "Vamos começar de novo? Me diga o que você quer lembrar."
      );
    }

    const { texto } = ctx.dados as { texto?: string };

    if (!texto) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Não encontrei o texto do lembrete.\n" +
        "Vamos começar de novo? Me diga o que você quer lembrar."
      );
    }

    const data = parseDataPtBr(dataHoraMsg);

    if (!data) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não consegui entender essa data.\n" +
        "Tente algo como *20/11/2025* ou *20/11*."
      );
    }

    await LembreteRepository.criar({
      usuarioId,
      mensagem: texto,
      dataAlvo: data
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      "⏰ Lembrete criado com sucesso!"
    );
  }
}

// Helper: tenta entender datas em formatos comuns em PT-BR
function parseDataPtBr(texto: string): Date | null {
  if (!texto) return null;
  texto = texto.trim();

  // 1) Primeiro tenta o parser nativo (pra ISO, "2025-11-20", etc.)
  const direto = new Date(texto);
  if (!isNaN(direto.getTime())) return direto;

  // 2) Formato DD/MM ou DD/MM/AAAA
  const m1 = texto.match(/^(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?$/);
  if (m1) {
    const dia = Number(m1[1]);
    const mes = Number(m1[2]) - 1;
    const ano = m1[3] ? Number(m1[3].replace(/[\/\-]/, "")) : new Date().getFullYear();

    const d = new Date(ano, mes, dia);
    if (!isNaN(d.getTime())) return d;
  }

  // 3) Formato "20 de novembro", "20 novembro 2025", etc.
  const meses: Record<string, number> = {
    janeiro: 0,
    fevereiro: 1,
    marco: 2,
    março: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11
  };

  const m2 = texto.match(
    /(\d{1,2}).*?(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:.*?(\d{4}))?/i
  );

  if (m2) {
    const dia = Number(m2[1]);
    const mesNome = m2[2].toLowerCase();
    const ano = m2[3] ? Number(m2[3]) : new Date().getFullYear();

    const mes = meses[mesNome];
    if (mes === undefined) return null;

    const d = new Date(ano, mes, dia);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
