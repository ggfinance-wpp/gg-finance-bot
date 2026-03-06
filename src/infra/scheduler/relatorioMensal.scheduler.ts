import cron from "node-cron";
import { RelatorioMensalService } from "../../services/RelatorioMensalService";
import { logger } from "../../utils/logger";
const CRON_SCHEDULE_RESUMO = process.env.CRON_SCHEDULE_RESUMO || "5 9 1 * *"; // Todo dia 1 de cada mês às 09:00

export class RelatorioMensalScheduler {
  /**
   * Inicia o scheduler para envio automático de relatórios mensais
   * Executa todo dia 1 de cada mês às 09:00
   */
  static iniciar() {
    // Cron: 0 9 1 * *
    // Minuto: 0, Hora: 9, Dia do mês: 1, Mês: *, Dia da semana: *
    cron.schedule(
      CRON_SCHEDULE_RESUMO,
      async () => {
        logger.info("📊 Executando scheduler de relatórios mensais...");
        
        try {
          await RelatorioMensalService.enviarRelatoriosMensaisAutomaticos();
        } catch (error) {
          logger.error("❌ Erro no scheduler de relatórios mensais:", error);
        }
      },
      {
        timezone: "America/Sao_Paulo",
      }
    );

    logger.info("✅ Scheduler de relatórios mensais iniciado (todo dia 1 às 09:00)");
  }

  /**
   * Executa o envio de relatórios imediatamente (para testes)
   */
  static async executarAgora() {
    logger.info("🧪 Executando envio de relatórios mensais manualmente...");
    await RelatorioMensalService.enviarRelatoriosMensaisAutomaticos();
  }
}
