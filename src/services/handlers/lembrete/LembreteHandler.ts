import { LembreteRepository } from "../../../repositories/lembrete.repository";
import { ContextoRepository } from "../../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";
import { parseDataPtBr } from "../../../utils/parseDatabr";

/* =======================
   Utilitários
======================= */

function textoTemAno(t?: string) {
  return !!t && /\b\d{4}\b/.test(t);
}

function textoTemReferenciaRelativa(t?: string) {
  if (!t) return false;
  return /\b(hoje|amanh[aã]|m[eê]s que vem|proximo mes|pr[oó]ximo m[eê]s)\b/i.test(t);
}

function textoIndicaDinheiro(t?: string) {
  if (!t) return false;
  return /\b(r\$|reais|conto|pagar|pix|transferir|cobrar)\b/i.test(t);
}

/* =======================
   Handler
======================= */

export class LembreteHandler {

  /* =======================
     CRIAÇÃO CENTRAL
  ======================= */
  private static async criar(
    telefone: string,
    usuarioId: string,
    mensagem: string,
    data: Date,
    valor: number | null
  ) {
    await LembreteRepository.criar({
      usuarioId,
      mensagem,
      dataAlvo: data,
      valor: valor ?? null
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔔 Vou te lembrar: *${mensagem}* em *${data.toLocaleDateString("pt-BR")}*`
    );
  }

  /* =======================
     INÍCIO
  ======================= */
  static async iniciar(
    telefone: string,
    usuarioId: string,
    mensagem: string | null,
    _dataIA: string | null,
    valor: number | null = null,
    textoOriginal?: string
  ) {
    if (!mensagem) {
      await ContextoRepository.salvar(telefone, { etapa: "criando_lembrete_texto" });
      return EnviadorWhatsApp.enviar(telefone, "💭 O que você quer que eu te lembre?");
    }

    const texto = textoOriginal ?? mensagem;
    const dataParse = parseDataPtBr(texto);

    // 🧠 Se conseguiu extrair uma data
    if (dataParse) {
      const temAno = textoTemAno(texto);
      const temRelativo = textoTemReferenciaRelativa(texto);

      // 📅 Falta ano?
      if (!temAno && !temRelativo) {
        await ContextoRepository.salvar(telefone, {
          etapa: "criando_lembrete_data",
          dados: { mensagem, valor, dataStr: texto }
        });

        return EnviadorWhatsApp.enviar(telefone, "📅 De qual ano?");
      }

      // 💰 Falta valor?
      if (textoIndicaDinheiro(texto) && valor == null) {
        await ContextoRepository.salvar(telefone, {
          etapa: "criando_lembrete_valor",
          dados: { mensagem, dataStr: texto }
        });

        return EnviadorWhatsApp.enviar(telefone, "💰 Qual o valor?");
      }

      return this.criar(telefone, usuarioId, mensagem, dataParse, valor);
    }

    // ❌ Nenhuma data detectada
    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_data",
      dados: { mensagem, valor }
    });

    return EnviadorWhatsApp.enviar(telefone, "📅 Quando devo te lembrar?");
  }

  /* =======================
     RECEBE DATA
  ======================= */
  static async salvarData(telefone: string, dataMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);

    const dados = ctx?.dados as {
      mensagem: string;
      valor?: number | null;
      dataStr?: string;
    };

    if (!dados?.mensagem) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Lembrete perdido. Tente novamente.");
    }

    const texto = dados.dataStr ? `${dados.dataStr} ${dataMsg}` : dataMsg;
    const data = parseDataPtBr(texto);

    if (!data) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Não entendi a data.");
    }

    // 💰 Falta valor?
    if (textoIndicaDinheiro(texto) && dados.valor == null) {
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_valor",
        dados: { mensagem: dados.mensagem, dataStr: texto }
      });

      return EnviadorWhatsApp.enviar(telefone, "💰 Qual o valor?");
    }

    return this.criar(telefone, usuarioId, dados.mensagem, data, dados.valor ?? null);
  }

  /* =======================
     RECEBE VALOR
  ======================= */
  static async salvarValor(telefone: string, valorMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);

    const dados = ctx?.dados as {
      mensagem: string;
      dataStr?: string;
    };

    if (!dados?.mensagem || !dados?.dataStr) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "❌ Data perdida. Comece novamente.");
    }

    const valor = Number(valorMsg.replace(/[^\d]/g, ""));
    if (!valor || valor <= 0) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Valor inválido.");
    }

    const data = parseDataPtBr(dados.dataStr);
    if (!data) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Não entendi a data.");
    }

    return this.criar(telefone, usuarioId, dados.mensagem, data, valor);
  }
}
