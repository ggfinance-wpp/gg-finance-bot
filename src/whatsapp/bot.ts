import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { logger } from "../utils/logger";
import { BotService } from "../services/bot.service"; // AGORA USAMOS O NOVO FLUXO
import { EnviadorWhatsApp } from "../services/EnviadorWhatsApp";

export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ["--no-sandbox"]
  }
});

export function startWhatsAppBot() {
  client.on("qr", (qr) => {
    console.log("\n📌 Escaneie o QR abaixo:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    logger.info("✅ WhatsApp conectado e pronto!");
  });

  client.on("auth_failure", () => logger.error("❌ Falha na autenticação"));

  client.on("message", async (msg) => {
    const telefone = msg.from.replace("@c.us", "");
    const mensagem = msg.body;

    console.log(`📩 ${telefone}: ${mensagem}`);

    // ❌ Ignora mensagens de grupos
    if (msg.from.includes("@g.us")) {
      console.log("📵 Mensagem de grupo ignorada.");
      return;
    }

    // 🔒 Número autorizado (SOMENTE VOCÊ)
    const numeroAutorizado = "558597280182"; // <- SEU NÚMERO AQUI

    // ❌ Ignora qualquer número que não seja o seu
    if (telefone !== numeroAutorizado) {
      console.log(`🚫 Ignorando número não autorizado: ${telefone}`);
      return;
    }

    // ✔️ Processa com a IA
    try {
      await BotService.processarMensagem(telefone, mensagem);
    } catch (error: any) {
      // 🔍 Detecta erro relacionado à IA (Gemini / OpenAI / etc.)
      const mensagemErro = error?.message || "";
      const status = error?.status || error?.code;

      const erroIA =
        mensagemErro.includes("API key") ||
        mensagemErro.includes("generative") ||
        mensagemErro.includes("Gemini") ||
        mensagemErro.includes("OpenAI") ||
        status === 429 || // rate limit
        status === 500 ||
        status === 503;

      if (erroIA) {
        console.error("🤖 Erro na IA:", {
          status,
          mensagem: mensagemErro
        });

        await EnviadorWhatsApp.enviar(
          telefone,
          "🤖 *IA indisponível no momento.*\nTente novamente em alguns instantes."
        );

        return;
      }

      // ❌ Erro genérico (não relacionado à IA)
      console.error("❌ Erro ao processar mensagem:", error?.message || error);

      await EnviadorWhatsApp.enviar(
        telefone,
        "❌ Ocorreu um erro inesperado. Tente novamente."
      );
    }
  });

  client.initialize();
}
