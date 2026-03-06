import { RelatorioMensalRepository } from "../repositories/relatorioMensal.repository";
import { RelatorioMensalPDFService } from "./geradores/RelatorioMensalPDF.service";
import { RelatorioMensalExcelService } from "./geradores/RelatorioMensalExcel.service";
import { EnviadorWhatsApp } from "./EnviadorWhatsApp";
import { logger } from "../utils/logger";
import { client } from "../whatsapp/bot";
import { MessageMedia } from "whatsapp-web.js";
import fs from "fs";
import { prisma } from "../infra/prisma";

export class RelatorioMensalService {
  /**
   * Gera e envia relatório mensal para um usuário específico
   */
  static async gerarEEnviar(
    usuarioId: string,
    userId: string,
    mes: number,
    ano: number,
    formato: "pdf" | "excel" | "ambos" = "ambos"
  ): Promise<void> {
    try {
      logger.info(
        `📊 Gerando relatório mensal para usuário ${usuarioId} - ${mes}/${ano}`
      );

      // Busca dados do relatório
      const dados = await RelatorioMensalRepository.buscarDadosRelatorio(
        usuarioId,
        mes,
        ano
      );

      if (!dados) {
        logger.warn(`⚠️ Usuário ${usuarioId} não encontrado`);
        return;
      }

      // Verifica se há transações no período
      if (
        dados.resumo.quantidadeReceitas === 0 &&
        dados.resumo.quantidadeDespesas === 0
      ) {
        logger.info(
          `ℹ️ Usuário ${usuarioId} não tem transações em ${mes}/${ano}`
        );
        await EnviadorWhatsApp.enviar(
          userId,
          `📊 *Relatório de ${dados.periodo.mesNome}/${dados.periodo.ano}*\n\n` +
            `Você não registrou nenhuma transação neste período.\n\n` +
            `💡 Continue usando o GG Finance para acompanhar suas finanças!`
        );
        return;
      }

      // Envia mensagem inicial
      await EnviadorWhatsApp.enviar(
        userId,
        `📊 *Relatório Mensal - ${dados.periodo.mesNome}/${dados.periodo.ano}*\n\n` +
          `Olá, *${dados.usuario.nome.split(" ")[0]}*! 👋\n\n` +
          `Seu relatório está sendo gerado... ⏳`
      );

      const arquivos: string[] = [];

      // Gera PDF
      if (formato === "pdf" || formato === "ambos") {
        logger.info(`📄 Gerando PDF...`);
        const caminhoPDF = await RelatorioMensalPDFService.gerar(dados);
        arquivos.push(caminhoPDF);
        logger.info(`✅ PDF gerado: ${caminhoPDF}`);
      }

      // Gera Excel
      if (formato === "excel" || formato === "ambos") {
        logger.info(`📊 Gerando Excel...`);
        const caminhoExcel = await RelatorioMensalExcelService.gerar(dados);
        arquivos.push(caminhoExcel);
        logger.info(`✅ Excel gerado: ${caminhoExcel}`);
      }

      // Prepara mensagem resumo
      const formatar = (valor: number) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor);

      const saldoEmoji = dados.resumo.saldo >= 0 ? "✅" : "⚠️";
      const saldoTexto = dados.resumo.saldo >= 0 ? "positivo" : "negativo";

      let mensagem = `📊 *Relatório de ${dados.periodo.mesNome}/${dados.periodo.ano}*\n\n`;
      mensagem += `💰 *Receitas:* ${formatar(dados.resumo.totalReceitas)}\n`;
      mensagem += `💸 *Despesas:* ${formatar(dados.resumo.totalDespesas)}\n`;
      mensagem += `${saldoEmoji} *Saldo:* ${formatar(
        dados.resumo.saldo
      )} (${saldoTexto})\n\n`;

      // Adiciona maior gasto
      if (dados.maiorGasto) {
        mensagem += `🔻 *Maior Gasto:*\n`;
        mensagem += `   ${dados.maiorGasto.descricao}\n`;
        mensagem += `   ${formatar(dados.maiorGasto.valor)} - ${
          dados.maiorGasto.categoria
        }\n\n`;
      }

      // Top 3 categorias de despesa
      const topDespesas = dados.categorias
        .filter((c) => c.tipo === "despesa")
        .slice(0, 3);

      if (topDespesas.length > 0) {
        mensagem += `📂 *Top Categorias de Despesa:*\n`;
        topDespesas.forEach((cat, index) => {
          mensagem += `   ${index + 1}. ${cat.nome}: ${formatar(
            cat.total
          )} (${cat.percentual.toFixed(1)}%)\n`;
        });
        mensagem += `\n`;
      }

      mensagem += `📎 Confira os arquivos anexados para mais detalhes!\n\n`;
      mensagem += `💡 *Dica:* Continue registrando suas finanças para insights mais precisos!`;

      // Envia mensagem resumo
      await EnviadorWhatsApp.enviar(userId, mensagem);

      // Envia arquivos
      for (const arquivo of arquivos) {
        await this.enviarArquivo(userId, arquivo);
        
        // Aguarda um pouco entre envios para evitar rate limit
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Remove arquivos temporários
      for (const arquivo of arquivos) {
        try {
          fs.unlinkSync(arquivo);
          logger.info(`🗑️ Arquivo removido: ${arquivo}`);
        } catch (error) {
          logger.error(`❌ Erro ao remover arquivo ${arquivo}:`, error);
        }
      }

      logger.info(
        `✅ Relatório mensal enviado com sucesso para usuário ${usuarioId}`
      );
    } catch (error) {
      logger.error(
        `❌ Erro ao gerar/enviar relatório para usuário ${usuarioId}:`,
        error
      );
      
      // Tenta notificar o usuário sobre o erro
      try {
        await EnviadorWhatsApp.enviar(
          userId,
          `❌ Ops! Ocorreu um erro ao gerar seu relatório mensal.\n\n` +
            `Por favor, tente novamente mais tarde ou entre em contato com o suporte.`
        );
      } catch (notifyError) {
        logger.error(`❌ Erro ao notificar usuário sobre falha:`, notifyError);
      }
    }
  }

  /**
   * Envia arquivo via WhatsApp
   */
  private static async enviarArquivo(
    userId: string,
    caminhoArquivo: string
  ): Promise<void> {
    try {
      const media = MessageMedia.fromFilePath(caminhoArquivo);
      const nomeArquivo = caminhoArquivo.split("/").pop() || "relatorio";

      await client.sendMessage(userId, media, {
        caption: `📎 ${nomeArquivo}`,
      });

      logger.info(`📎 Arquivo enviado: ${nomeArquivo}`);
    } catch (error) {
      logger.error(`❌ Erro ao enviar arquivo ${caminhoArquivo}:`, error);
      throw error;
    }
  }

  /**
   * Gera e envia relatórios para todos os usuários que tiveram transações no mês anterior
   */
  static async enviarRelatoriosMensaisAutomaticos(): Promise<void> {
    try {
      const agora = new Date();
      const mesAnterior = agora.getMonth(); // 0-11 (janeiro = 0)
      const anoAnterior = mesAnterior === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
      const mes = mesAnterior === 0 ? 12 : mesAnterior;
      const ano = anoAnterior;

      logger.info(
        `🤖 Iniciando envio automático de relatórios mensais - ${mes}/${ano}`
      );

      // Busca todos os usuários com transações no mês anterior
      const usuariosIds = await RelatorioMensalRepository.buscarUsuariosComTransacoes(
        mes,
        ano
      );

      if (usuariosIds.length === 0) {
        logger.info(`ℹ️ Nenhum usuário com transações em ${mes}/${ano}`);
        return;
      }

      logger.info(
        `📨 Enviando relatórios para ${usuariosIds.length} usuários...`
      );

      // Busca dados dos usuários para pegar o userId (telefone WhatsApp)
      
      for (const usuarioId of usuariosIds) {
        const usuario = await prisma.usuario.findUnique({
          where: { id: usuarioId },
          select: { userId: true },
        });

        if (!usuario) {
          logger.warn(`⚠️ Usuário ${usuarioId} não encontrado no banco`);
          continue;
        }

        try {
          await this.gerarEEnviar(usuarioId, usuario.userId, mes, ano, "ambos");
          
          // Aguarda entre envios para evitar sobrecarga
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          logger.error(
            `❌ Erro ao processar relatório do usuário ${usuarioId}:`,
            error
          );
          // Continua com próximo usuário mesmo em caso de erro
        }
      }

      logger.info(
        `✅ Envio automático de relatórios mensais concluído - ${mes}/${ano}`
      );
    } catch (error) {
      logger.error(`❌ Erro no envio automático de relatórios:`, error);
    }
  }
}
