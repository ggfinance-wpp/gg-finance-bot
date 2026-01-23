import { LembreteRepository } from "../../../repositories/lembrete.repository";
import { ContextoRepository } from "../../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";
import { parseDataPtBr } from "../../../utils/parseDatabr";

export class LembreteHandler {

  /**
   * Tenta interpretar a data tanto em formato pt-BR ("20/11", "amanhã")
   * quanto em formato ISO ("2023-12-21") que vem da IA.
   */
  private static parseDataInteligente(dataStr: string): Date | null {
    if (!dataStr) return null;

    const hoje = new Date();

    const pt = parseDataPtBr(dataStr);
    if (pt) {
      // 🔑 REGRA: se o parser não trouxe ano, assume o atual
      if (pt.getFullYear() === 1970 || isNaN(pt.getFullYear())) {
        pt.setFullYear(hoje.getFullYear());
      }
      return pt;
    }

    // 2️⃣ tenta ISO (YYYY-MM-DD)
    const iso = new Date(dataStr);
    if (!isNaN(iso.getTime())) {
      return iso;
    }

    return null;
  }


  static async iniciar(
    telefone: string,
    usuarioId: string,
    mensagem: string | null,
    data: string | null,
    valor: number | null = null,
    textoOriginal?: string
  ) {

    // ✅ Caso ideal: IA já mandou mensagem + data + valor
    if (mensagem && data && valor !== null) {
      return this.salvarCompletoComParse(telefone, usuarioId, mensagem, data, valor);
    }

    // Mensagem + valor, mas sem data → antes de perguntar, tenta extrair do texto original
    if (mensagem && valor !== null && !data) {
      const textoParaParse = textoOriginal ?? mensagem;

      const dataDireta = parseDataPtBr(textoParaParse);
      if (dataDireta) {
        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: dataDireta,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(
          telefone,
          `🔔 Vou te lembrar: *${mensagem}* em *${dataDireta.toLocaleDateString("pt-BR")}*`
        );
      }

      // se não achou data no texto, aí sim pergunta
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "📅 Falta a data. Quando devo te lembrar disso?"
      );
    }

    // Mensagem + data, mas sem valor → pedir valor
    if (mensagem && valor !== null && !data) {
      const textoParaParse = (textoOriginal ?? mensagem).toLowerCase().trim();

      // ✅ tenta extrair data do texto original antes de perguntar
      const dataDireta = parseDataPtBr(textoParaParse);
      if (dataDireta) {
        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: dataDireta,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(
          telefone,
          `🔔 Vou te lembrar: *${mensagem}* em *${dataDireta.toLocaleDateString("pt-BR")}*`
        );
      }

      // se não achou, aí sim pergunta
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "📅 Falta a data. Quando devo te lembrar disso?"
      );
    }

    // Só mensagem → pedir data
    // 🔑 TENTATIVA BACKEND: mensagem pode conter data embutida
    // 🔑 TENTATIVA DEFINITIVA: usar texto original do usuário
    if (mensagem && !data) {
      const textoParaParse = textoOriginal ?? mensagem;

      // tenta parser completo
      const dataDireta = parseDataPtBr(textoParaParse);

      if (dataDireta) {
        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: dataDireta,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(
          telefone,
          `🔔 Vou te lembrar: *${mensagem}* em *${dataDireta.toLocaleDateString("pt-BR")}*`
        );
      }

      // tenta fallback semântico (dia + mês)
      const dia = extrairDiaSimples(textoParaParse);
      const mesAno = extrairMesEAno(textoParaParse);

      if (dia && mesAno) {
        const dataInferida = new Date(
          mesAno.ano ?? new Date().getFullYear(),
          mesAno.mes - 1,
          dia
        );

        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: dataInferida,
          valor
        });

        await ContextoRepository.limpar(telefone);

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

  static async salvarValor(telefone: string, valorMsg: string, usuarioId: string) {
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
