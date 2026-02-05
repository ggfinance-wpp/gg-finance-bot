import { InterpretadorGemini } from "../ia/interpretadorGemini";
import { RespostaGemini } from "../ia/respostaGemini";

import { RegistrarDespesaHandler } from "../services/handlers/financeiro/RegistrarDespesaHandler";
import { RegistrarReceitaHandler } from "../services/handlers/financeiro/RegistrarReceitaHandler";
import { LembreteHandler } from "../services/handlers/lembrete/LembreteHandler";
import { AgendamentoHandler } from "../services/handlers/AgendamentoHandler";
import { EditarTransacaoHandler } from "../services/handlers/financeiro/EditarTransacaoHandler";

import { PerfilHandler } from "../services/handlers/PerfilHandler";
import { CadastroUsuarioHandler } from "../services/handlers/CadastroUsuarioHandler";

import { UsuarioRepository } from "../repositories/usuario.repository";
import { ContextoRepository } from "../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../services/EnviadorWhatsApp";
import { ExcluirLembreteHandler } from "../services/handlers/lembrete/ExcluirLembreteHandler";
import { ListarDespesasHandler } from "../services/handlers/financeiro/ListarDespesaHandler";

import { detectores } from "../utils/detectoresDeIntencao";
import { RecorrenciaHandler } from "../services/handlers/financeiro/RecorrenciaHandler";
import { ExcluirTransacaoHandler } from "../services/handlers/financeiro/ExcluirTransacaoHandler";
import { GastoPorCategoriaHandler } from "../services/handlers/relatorios/GastoPorCategoriaHandler";
import { GastosDaCategoriaHandler } from "../services/handlers/relatorios/GastosDaCategoriaHandler";
import { RelatorioHandler } from "../services/handlers/relatorios/RelatorioHandler";
import { CategoriaHandler } from "../services/handlers/financeiro/CategoriaHandler";
import { ListarReceitasHandler } from "../services/handlers/financeiro/ListarReceitaHandler";
import { rateLimitIA } from "../middlewares/rateLimit.middleware";
import { extrairDiaUtilPtBr } from "../utils/parseDatabr";

export class AssistenteFinanceiro {
  private static normalizarMensagem(mensagem: string) {
    return mensagem
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  private static extrairValorMonetario(bruto: string): number | null {
    if (!bruto) return null;

    const m = bruto.match(
      /\b(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\b(?!\s*(?:dia|dias|semana|semanas|mes|m[eê]s|ano|anos))/i
    );
    if (!m) return null;

    const raw = m[1];
    const normal = raw.includes(",")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw;

    const n = Number(normal);
    if (!Number.isFinite(n) || n <= 0) return null;

    return n;
  }

  private static limparCabecalhoComando(bruto: string) {
    let t = (bruto ?? "").trim();

    t = t.replace(/^(oi|ola|olá|bom dia|boa tarde|boa noite)\s*/i, "");

    t = t.replace(
      /\b(gostaria\s+que\s+me\s+lembrasse\s+de|gostaria\s+que\s+me\s+lembrasse|me\s+lembra\s+de|me\s+lembre\s+de|me\s+lembra|me\s+lembre|lembrete\s+de|lembrete|cria\s+uma\s+recorrencia|criar\s+recorrencia|criar\s+uma\s+recorrencia|recorrencia|recorrência)\b/gi,
      ""
    );

    return t.trim();
  }

  private static removerDataEValor(t: string) {
    // remove dia útil (ambas as formas)
    t = t.replace(/\b(?:dia\s*)?(\d{1,2})\s*(?:o|º)?\s*dia\s+util\b/gi, "");
    t = t.replace(/\bdia\s*(\d{1,2})\s*util\b/gi, "");

    // remove datas numéricas
    t = t.replace(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, "");

    // remove valor solto (70 / 1.110,00 / 70,00)
    t = t.replace(/\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g, "");

    return t;
  }

  private static extrairDescricaoRecorrencia(bruto: string) {
    let t = this.limparCabecalhoComando(bruto);

    // remove palavras de frequência
    t = t.replace(/\b(todo\s+m[eê]s|mensal|todo\s+dia|diari[oa]|semanal|anual)\b/gi, "");

    t = this.removerDataEValor(t);

    t = t.replace(/\s{2,}/g, " ").trim();
    return t.length ? t : null;
  }

  private static extrairTextoLembrete(bruto: string) {
    let t = this.limparCabecalhoComando(bruto);

    // ⚠️ aqui eu NÃO removo "todo mês/mensal", porque pode ser parte do texto do lembrete.
    // só tiro data/valor.
    t = this.removerDataEValor(t);

    t = t.replace(/\s{2,}/g, " ").trim();
    return t.length ? t : null;
  }

  static async processar(userId: string, mensagem: string) {
    const usuario = await UsuarioRepository.buscarPorUserId(userId);
    const contexto = await ContextoRepository.obter(userId);

    const msgLower = mensagem.trim().toLowerCase();
    if (msgLower === "#reset" || msgLower === "/reset") {
      await ContextoRepository.limpar(userId);
      await EnviadorWhatsApp.enviar(userId, "🧹 Contexto apagado! Podemos começar do zero.");
      return;
    }

    if (usuario && !contexto) {
      const ehSaudacao =
        ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].some(s =>
          msgLower.startsWith(s)
        ) &&
        msgLower.length <= 20 &&
        !/\d/.test(msgLower);

      if (ehSaudacao) {
        await EnviadorWhatsApp.enviar(
          userId,
          `👋 Olá, *${usuario.nome?.split(" ")[0] || "tudo bem"}*! Como posso te ajudar hoje?`
        );
        return;
      }
    }

    if (contexto) {
      switch (contexto.etapa) {
        case "criando_categoria_nome":
          return CategoriaHandler.salvarNome(userId, mensagem);

        case "criando_categoria_tipo":
          return CategoriaHandler.salvarTipo(userId, mensagem, usuario!.id);

        case "informar_data_agendada":
          return AgendamentoHandler.salvarData(userId, mensagem, usuario!.id);

        case "criando_lembrete_data":
          return LembreteHandler.salvarData(userId, mensagem, usuario!.id);

        case "criando_lembrete_valor":
          return LembreteHandler.salvarValor(userId, mensagem, usuario!.id);

        case "editar_transacao_id":
          return EditarTransacaoHandler.selecionar(userId, mensagem);

        case "editar_transacao_opcao":
          if (mensagem.startsWith("1")) return EditarTransacaoHandler.editarValor(userId, Number(mensagem));
          if (mensagem.startsWith("2")) return EditarTransacaoHandler.editarDescricao(userId, mensagem);
          break;

        case "excluir_transacao_id":
          return ExcluirTransacaoHandler.confirmar(userId, mensagem);

        case "confirmar_exclusao":
          return ExcluirTransacaoHandler.executar(userId, mensagem);

        case "excluir_lembrete_escolher":
          return ExcluirLembreteHandler.escolher(userId, mensagem);

        case "confirmar_exclusao_lembrete":
          return ExcluirLembreteHandler.executar(userId, mensagem);

        case "confirmar_criar_recorrencia":
          return RecorrenciaHandler.confirmarCriacao(userId, usuario!.id, mensagem, contexto.dados);

        case "informar_valor_recorrencia":
          return RecorrenciaHandler.salvarValor(userId, usuario!.id, mensagem, contexto.dados);
      }
    }

    if (!usuario) {
      return CadastroUsuarioHandler.executar(userId, mensagem);
    }

    const mensagemNormalizada = this.normalizarMensagem(mensagem);

    // ============================
    // PRIORIDADE: RECORRÊNCIA
    // Regra: precisa ter termo de frequência
    // e precisa ter cara de "transação" (pagar/receber/conta etc) OU conter "dia útil"
    // ============================
    const temFrequencia =
      /\b(todo\s+m[eê]s|mensal|todo\s+dia|diari[oa]|semanal|anual)\b/.test(mensagemNormalizada);

    const temGatilhoTransacao =
      /\b(pagar|pagamento|conta|boleto|fatura|receber|recebo|salario|salário|entrada)\b/.test(mensagemNormalizada);

    const regraDiaUtil = extrairDiaUtilPtBr(mensagem);

    const pareceRecorrencia = temFrequencia && (temGatilhoTransacao || !!regraDiaUtil);

    if (pareceRecorrencia) {
      const descricao = this.extrairDescricaoRecorrencia(mensagem);
      const valor = this.extrairValorMonetario(mensagem);

      if (!descricao) {
        await EnviadorWhatsApp.enviar(
          userId,
          "❌ Não entendi o que você quer tornar recorrente. Ex:\n" +
          "• “pagar academia todo mês dia 10 130”\n" +
          "• “recebo salário todo mês dia 1 3200”"
        );
        return;
      }

      await RecorrenciaHandler.iniciarCriacao(
        userId,
        usuario.id,
        descricao,
        valor ?? null,
        "mensal",
        null,
        regraDiaUtil ? "N_DIA_UTIL" : null,
        null,
        regraDiaUtil?.n ?? null
      );
      return;
    }

    // ============================
    // PRIORIDADE: LEMBRETE (não recorrência)
    // ============================
    const pareceCriacaoLembrete =
      /\b(lembrete|lembrar|lembrasse|me\s+lembra|me\s+lembre|gostaria\s+que\s+me\s+lembrasse)\b/.test(mensagemNormalizada) &&
      !/\b(meus|minhas|listar|ver|mostrar|exibir|quais)\b/.test(mensagemNormalizada);

    if (pareceCriacaoLembrete) {
      const textoLembrete = this.extrairTextoLembrete(mensagem);

      await LembreteHandler.iniciar(
        userId,
        usuario.id,
        textoLembrete,
        null,
        null,
        mensagem
      );
      return;
    }

    // ============================
    // DETECTORES
    // ============================
    const ctx = { userId, usuarioId: usuario.id, mensagem, mensagemNormalizada };

    for (const detector of detectores) {
      if (detector.match(ctx)) {
        await detector.executar(ctx);
        return;
      }
    }

    if (!rateLimitIA(usuario.id)) {
      await EnviadorWhatsApp.enviar(
        userId,
        "⏳ Você está usando rápido demais. Aguarde um pouco antes de tentar novamente."
      );
      return;
    }

    // ============================
    // IA
    // ============================
    const interpretacao = await InterpretadorGemini.interpretarMensagem(mensagem, { usuario });
    const intents = Array.isArray(interpretacao) ? interpretacao : [interpretacao];

    let processou = false;

    for (const intent of intents) {
      switch (intent.acao) {
        case "registrar_despesa":
          processou = true;
          await RegistrarDespesaHandler.executar(
            userId,
            usuario.id,
            intent.valor,
            intent.descricao,
            intent.agendar,
            intent.dataAgendada,
            intent.categoria
          );
          break;

        case "registrar_receita":
          processou = true;
          await RegistrarReceitaHandler.executar(
            userId,
            usuario.id,
            intent.valor,
            intent.descricao,
            intent.dataAgendada,
            intent.categoria
          );
          break;

        case "criar_categoria":
          processou = true;
          await CategoriaHandler.iniciarCriacao(userId);
          break;

        case "criar_lembrete":
          processou = true;
          await LembreteHandler.iniciar(
            userId,
            usuario.id,
            intent.mensagem ?? this.extrairTextoLembrete(mensagem),
            intent.data ?? null,
            intent.valor ?? null,
            mensagem
          );
          return;

        case "criar_recorrencia": {
          processou = true;

          const regraDiaUtil = extrairDiaUtilPtBr(mensagem);
          const regraMensalFinal = intent.regraMensal ?? (regraDiaUtil ? "N_DIA_UTIL" : null);
          const nDiaUtilFinal = intent.nDiaUtil ?? regraDiaUtil?.n ?? null;

          await RecorrenciaHandler.iniciarCriacao(
            userId,
            usuario.id,
            intent.descricao ?? this.extrairDescricaoRecorrencia(mensagem),
            intent.valor ?? this.extrairValorMonetario(mensagem),
            intent.frequencia ?? null,
            intent.tipo ?? null,
            regraMensalFinal,
            intent.diaDoMes ?? null,
            nDiaUtilFinal
          );
          break;
        }

        case "ver_saldo":
          processou = true;
          await RelatorioHandler.executar(userId, usuario.id);
          break;

        case "ver_gastos_por_categoria":
          processou = true;
          await GastoPorCategoriaHandler.executar(userId, usuario.id);
          break;

        case "ver_gastos_da_categoria":
          if (intent.categoria) {
            processou = true;
            await GastosDaCategoriaHandler.executar(userId, usuario.id, intent.categoria);
          }
          break;

        case "ver_receitas_detalhadas":
          processou = true;
          await ListarReceitasHandler.executar(userId, usuario.id);
          break;

        case "ver_despesas_detalhadas":
          processou = true;
          await ListarDespesasHandler.executar(userId, usuario.id);
          break;

        case "ver_perfil":
          processou = true;
          await PerfilHandler.executar(userId, usuario.id);
          break;

        case "ajuda":
          processou = true;
          await EnviadorWhatsApp.enviar(
            userId,
            "📌 *Como posso te ajudar?*\n\n" +
            "• Registrar *despesa*\n" +
            "• Registrar *receita*\n" +
            "• Ver *saldo*\n" +
            "• Ver *gastos por categoria*\n" +
            "• Criar *lembrete*\n" +
            "• Criar *categoria*"
          );
          break;
      }
    }

    if (processou) return;

    const resposta = await RespostaGemini.gerar(`
Você é o assistente financeiro *GG Finance*.
Responda em português e apenas sobre finanças.
Mensagem:
"${mensagem}"
    `);

    await EnviadorWhatsApp.enviar(userId, resposta);
  }
}
