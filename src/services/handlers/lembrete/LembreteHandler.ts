import { LembreteRepository } from "../../../repositories/lembrete.repository";
import { ContextoRepository } from "../../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../../EnviadorWhatsApp";
import { extrairDiaSimples, normalizarMes, parseDataPtBr } from "../../../utils/parseDatabr";
import { extrairMesEAno } from "../../../utils/periodo";

export class LembreteHandler {

  private static inicioDoDia(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private static dataEhPassada(data: Date) {
    const hoje = this.inicioDoDia(new Date());
    const alvo = this.inicioDoDia(data);
    return alvo.getTime() < hoje.getTime();
  }

  private static async bloquearSePassado(
    telefone: string,
    mensagem: string,
    valor: number | null,
    data: Date
  ) {
    if (!this.dataEhPassada(data)) return false;

    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_data",
      dados: { mensagem, valor }
    });

    await EnviadorWhatsApp.enviar(
      telefone,
      `⚠️ Essa data (*${data.toLocaleDateString("pt-BR")}*) já passou.\n` +
      `📅 Me diga uma data a partir de hoje (ex: *hoje*, *amanhã*, *25/01*).`
    );

    return true;
  }

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
    telefone: string, //telefone mas recebe o userId da tabela
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
        // ✅ NOVO: bloqueia se for passado
        const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor, dataDireta);
        if (bloqueado) return;

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
        // ✅ NOVO: bloqueia se for passado
        const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor, dataDireta);
        if (bloqueado) return;

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
    if (mensagem && !data) {
      const textoParaParse = textoOriginal ?? mensagem;

      // tenta parser completo
      const dataDireta = parseDataPtBr(textoParaParse);

      if (dataDireta) {
        // ✅ NOVO: bloqueia se for passado
        const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor ?? null, dataDireta);
        if (bloqueado) return;

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

        // ✅ NOVO: bloqueia se for passado
        const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor ?? null, dataInferida);
        if (bloqueado) return;

        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: dataInferida,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(
          telefone,
          `🔔 Vou te lembrar: *${mensagem}* em *${dataInferida.toLocaleDateString("pt-BR")}*`
        );
      }

      // só agora pergunta
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "📅 Quando devo te lembrar?"
      );
    }

    // Só data → pedir texto
    if (data && !mensagem) {
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_texto",
        dados: { data, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "💭 O que você quer que eu te lembre?"
      );
    }

    // Nada ainda → começar pedindo o texto
    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_texto"
    });

    return EnviadorWhatsApp.enviar(
      telefone,
      "💭 O que você quer que eu te lembre?"
    );
  }

  private static async salvarCompletoComParse(
    telefone: string,
    usuarioId: string,
    mensagem: string,
    dataStr: string,
    valor: number | null
  ) {
    const data = this.parseDataInteligente(dataStr);

    if (!data) {
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Não consegui entender a data."
      );
    }

    // ✅ NOVO: bloqueia se for passado
    const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor, data);
    if (bloqueado) return;

    await LembreteRepository.criar({
      usuarioId,
      mensagem,
      dataAlvo: data,
      valor
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔔 Vou te lembrar: *${mensagem}* em *${data.toLocaleDateString("pt-BR")}*`
    );
  }

  static async salvarTexto(telefone: string, texto: string) {
    await ContextoRepository.atualizarDados(telefone, { texto });

    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_data",
      dados: { texto }
    });

    return EnviadorWhatsApp.enviar(
      telefone,
      "📆 Quando devo te lembrar? (Ex: 20/11)"
    );
  }

  static async salvarData(telefone: string, dataMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);
    const dados = ctx?.dados as {
      mensagem?: string;
      texto?: string;
      valor?: number | null;
    };

    const mensagem = dados?.mensagem ?? dados?.texto ?? null;
    const valor = dados?.valor ?? null;

    if (!mensagem) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Não encontrei o texto do lembrete.");
    }

    const data = this.parseDataInteligente(dataMsg);
    if (!data) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Data inválida.");
    }

    //bloqueia se for passadoo
    const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor, data);
    if (bloqueado) return;

    await LembreteRepository.criar({
      usuarioId,
      mensagem,
      dataAlvo: data,
      valor
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔔 Lembrete criado para ${data.toLocaleDateString("pt-BR")}!`
    );
  }

  static async salvarValor(telefone: string, valorMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);
    const dados = ctx?.dados as {
      mensagem?: string;
      texto?: string;
      data?: string;
      dia?: number;
    };

    const valor = Number(valorMsg.replace(/[^\d]/g, ""));
    if (isNaN(valor) || valor <= 0) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Valor inválido.");
    }

    const mensagem = dados?.mensagem ?? dados?.texto;
    if (!mensagem) {
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Texto do lembrete não encontrado.");
    }

    // Se já tinha data completa
    if (dados?.data) {
      const data = this.parseDataInteligente(dados.data);
      if (data) {
        const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor, data);
        if (bloqueado) return;

        await LembreteRepository.criar({
          usuarioId,
          mensagem,
          dataAlvo: data,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(telefone, "🔔 Lembrete criado!");
      }
    }

    // Se só tinha dia → pedir mês
    if (dados?.dia) {
      await ContextoRepository.salvar(telefone, {
        etapa: "complementar_mes_lembrete",
        dados: { mensagem, dia: dados.dia, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        `📅 Dia *${dados.dia}* de qual mês?`
      );
    }

    // fallback
    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_data",
      dados: { mensagem, valor }
    });

    return EnviadorWhatsApp.enviar(
      telefone,
      "📅 Informe a data do lembrete."
    );
  }

  static async salvarMes(telefone: string, mesMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);
    const dados = ctx?.dados as {
      dia?: number;
      mensagem?: string;
      valor?: number | null;
    };

    if (!dados?.dia || !dados?.mensagem) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Não encontrei o lembrete anterior.");
    }

    const { dia, mensagem, valor } = dados;

    const dataCompleta = this.parseDataInteligente(mesMsg);
    if (dataCompleta) {
      const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor ?? null, dataCompleta);
      if (bloqueado) return;

      await LembreteRepository.criar({
        usuarioId,
        mensagem,
        dataAlvo: dataCompleta,
        valor: valor ?? null
      });

      await ContextoRepository.limpar(telefone);

      return EnviadorWhatsApp.enviar(
        telefone,
        `🔔 Lembrete criado para ${dataCompleta.toLocaleDateString("pt-BR")}!`
      );
    }

    const mesAno = extrairMesEAno(mesMsg);

    let mesIndex: number | null = null;
    let anoFinal: number;

    if (mesAno) {
      mesIndex = mesAno.mes - 1;
      anoFinal = mesAno.ano ?? new Date().getFullYear();
    } else {
      mesIndex = normalizarMes(mesMsg);
      if (mesIndex === null) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ Não entendi o mês. Ex: *este mês*, *novembro*, *mês que vem*."
        );
      }
      anoFinal = new Date().getFullYear();
    }

    const dataFinal = new Date(anoFinal, mesIndex, dia);

    const bloqueado = await this.bloquearSePassado(telefone, mensagem, valor ?? null, dataFinal);
    if (bloqueado) return;

    await LembreteRepository.criar({
      usuarioId,
      mensagem,
      dataAlvo: dataFinal,
      valor: valor ?? null
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔔 Lembrete criado para ${dataFinal.toLocaleDateString("pt-BR")}!`
    );
  }
}