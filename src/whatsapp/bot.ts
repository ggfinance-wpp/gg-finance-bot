// whatsapp.bot.ts
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { logger } from "../utils/logger";
import { BotService } from "../services/bot.service";

export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ]
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

  client.on("auth_failure", () =>
    logger.error("❌ Falha na autenticação")
  );

  client.on("message", async (msg) => {
    // ❌ ignora grupos
    if (msg.from.endsWith("@g.us")) return;

    const mensagem = msg.body.trim();
    const chat = await msg.getChat();

    // 🔑 IDENTIDADE ÚNICA
    const userId = chat.id._serialized; // @lid ou @c.us

    console.log(`📩 ${userId}: ${mensagem}`);

    try {
      await BotService.processarMensagem(userId, mensagem);
    } catch (error: any) {
      const mensagemErro = error?.message || "";
      const status = error?.status || error?.code;

      if (status === 429 || mensagemErro.includes("429")) {
        await client.sendMessage(
          userId,
          "⏳ *Calma lá!* Você está usando o assistente muito rápido.\nAguarde alguns instantes 🙂"
        );
        return;
      }

      const erroIA =
        mensagemErro.includes("API key") ||
        mensagemErro.includes("Gemini") ||
        mensagemErro.includes("OpenAI") ||
        status === 500 ||
        status === 503;

      if (erroIA) {
        await client.sendMessage(
          userId,
          "🤖 *IA temporariamente indisponível.*\nTente novamente em instantes."
        );
        return;
      }

      await client.sendMessage(
        userId,
        "❌ Ocorreu um erro inesperado.\nTente novamente mais tarde."
      );
    }
  });

  client.initialize();
}
