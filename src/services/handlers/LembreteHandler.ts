import { LembreteRepository } from "../../repositories/lembrete.repository";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { extrairDiaSimples, normalizarMes, parseDataPtBr } from "../../utils/parseDatabr";

export class LembreteHandler {

  static async iniciar(
    telefone: string,
    usuarioId: string,
    mensagem: string | null,
    data: string | null,
    valor: number | null = null
  ) {

    if (mensagem && data && valor !== null) {
      return this.salvarCompletoComParse(telefone, usuarioId, mensagem, data, valor);
    }

    if (mensagem && valor !== null && !data) {
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "📅 Falta a data. Quando devo te lembrar disso?"
      );
    }

    if (mensagem && data && valor === null) {
      const apenasDia = extrairDiaSimples(data);

      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_valor",
        dados: { mensagem, data, dia: apenasDia }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "💰 Qual o valor desse lembrete?"
      );
    }

    if (mensagem && !data) {
      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "📅 Quando devo te lembrar? Ex: 20/11 ou amanhã."
      );
    }

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
    const data = parseDataPtBr(dataStr);

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

    const texto = dados?.mensagem ?? dados?.texto ?? null;
    const valor = dados?.valor ?? null;

    if (!texto) {
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Texto não encontrado.");
    }

    const data = parseDataPtBr(dataMsg);
    if (!data) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Data inválida.");
    }

    await LembreteRepository.criar({
      usuarioId,
      mensagem: texto,
      dataAlvo: data,
      valor
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(telefone, "⏰ Lembrete criado!");
  }


  static async salvarValor(telefone: string, valorMsg: string, usuarioId: string) {
    const ctx = await ContextoRepository.obter(telefone);
    const dados = ctx?.dados as {
      mensagem?: string;
      texto?: string;
      data?: string;
      dia?: number;
    };

    if (!dados) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Nada encontrado.");
    }

    const valor = Number(valorMsg.replace(/[^\d]/g, ""));
    if (isNaN(valor) || valor <= 0) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Valor inválido.");
    }

    const mensagemFinal = dados.mensagem ?? dados.texto;

    if (!mensagemFinal) {
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Texto do lembrete não encontrado.");
    }

    if (dados.data && !dados.dia) {
      const parsed = parseDataPtBr(dados.data);

      if (parsed) {
        await LembreteRepository.criar({
          usuarioId,
          mensagem: mensagemFinal,
          dataAlvo: parsed,
          valor
        });

        await ContextoRepository.limpar(telefone);

        return EnviadorWhatsApp.enviar(
          telefone,
          `🔔 Lembrete criado: *${mensagemFinal}*`
        );
      }

      await ContextoRepository.salvar(telefone, {
        etapa: "criando_lembrete_data",
        dados: { mensagem: mensagemFinal, valor }
      });

      return EnviadorWhatsApp.enviar(telefone, "📅 Informe a data do lembrete.");
    }

    if (dados.dia) {
      await ContextoRepository.salvar(telefone, {
        etapa: "complementar_mes_lembrete",
        dados: { mensagem: mensagemFinal, dia: dados.dia, valor }
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        `📅 Certo! Dia *${dados.dia}* de qual mês?`
      );
    }

    await ContextoRepository.salvar(telefone, {
      etapa: "criando_lembrete_data",
      dados: { mensagem: mensagemFinal, valor }
    });

    return EnviadorWhatsApp.enviar(telefone, "📅 Informe a data do lembrete.");
  }


  static async salvarMes(telefone: string, mesMsg: string, usuarioId: string) {

    const ctx = await ContextoRepository.obter(telefone);
    const dados = ctx?.dados as { dia?: number; mensagem?: string; valor?: number | null };

    if (!dados?.dia || !dados?.mensagem) {
      await ContextoRepository.limpar(telefone);
      return EnviadorWhatsApp.enviar(telefone, "⚠️ Não encontrei o lembrete anterior.");
    }

    const { dia, mensagem, valor } = dados;

    const dataCompleta = parseDataPtBr(mesMsg);
    if (dataCompleta) {
      await LembreteRepository.criar({
        usuarioId,
        mensagem,
        dataAlvo: dataCompleta,
        valor: valor ?? null
      });

      await ContextoRepository.limpar(telefone);

      return EnviadorWhatsApp.enviar(
        telefone,
        `🔔 Lembrete criado: *${mensagem}*`
      );
    }

    const mes = normalizarMes(mesMsg);
    if (mes === null) {
      return EnviadorWhatsApp.enviar(telefone, "❌ Não entendi o mês.");
    }

    const hoje = new Date();
    let ano = hoje.getFullYear();
    let data = new Date(ano, mes, dia);

    if (data < hoje) {
      ano += 1;
      data = new Date(ano, mes, dia);
    }

    await LembreteRepository.criar({
      usuarioId,
      mensagem,
      dataAlvo: data,
      valor: valor ?? null
    });

    await ContextoRepository.limpar(telefone);

    return EnviadorWhatsApp.enviar(
      telefone,
      `🔔 Lembrete criado para ${data.toLocaleDateString("pt-BR")}!`
    );
  }
}
