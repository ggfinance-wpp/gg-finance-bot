import cron from "node-cron";
import { LembreteScheduler } from "./lembrete.scheduler";
import { RelatorioMensalScheduler } from "./relatorioMensal.scheduler";

export function iniciarSchedulers() {
  //roda a cada minuto
  cron.schedule("* * * * *", async () => {
    try {
      await LembreteScheduler.executar();
    } catch (e) {
      console.error("Erro no scheduler de lembretes", e);
    }
  });

  // Inicia scheduler de relatórios mensais (todo dia 1 às 09:00)
  RelatorioMensalScheduler.iniciar();
}
