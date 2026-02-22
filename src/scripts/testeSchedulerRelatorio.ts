/**
 * Script de teste para o scheduler de relatórios mensais
 * Executa o envio automático para todos os usuários (modo teste)
 * 
 * USO:
 * npx tsx src/scripts/testeSchedulerRelatorio.ts
 */

import { RelatorioMensalScheduler } from "../infra/scheduler/relatorioMensal.scheduler";
import { connectDatabase } from "../infra/prisma";
import { logger } from "../utils/logger";

async function testarScheduler() {
  try {
    console.log("\n🧪 TESTE DO SCHEDULER DE RELATÓRIOS MENSAIS\n");
    console.log("⚠️  ATENÇÃO: Este script vai enviar relatórios via WhatsApp!");
    console.log("    Certifique-se de que o bot está conectado.\n");

    // Aguarda 3 segundos para permitir cancelamento
    console.log("⏳ Iniciando em 3 segundos... (Ctrl+C para cancelar)");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Conecta ao banco
    await connectDatabase();

    // Executa o scheduler
    await RelatorioMensalScheduler.executarAgora();

    console.log("\n✅ Teste concluído!\n");
  } catch (error) {
    console.error("\n❌ Erro ao executar teste:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testarScheduler();
