import cron from "node-cron";
import { LembreteScheduler } from "./lembrete.scheduler";

export function iniciarSchedulers() {
  cron.schedule("* * * * *", async () => {
    try {
      await LembreteScheduler.executar();
    } catch (e) {
      console.error("Erro no scheduler de lembretes", e);
    }
  });
}
