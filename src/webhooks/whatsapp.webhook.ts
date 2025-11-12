import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { logger } from "../utils/logger";
import {
  validarAssinaturaWebhook,
  sanitizeInput,
  mascararTelefone
} from "../utils/seguranca.utils";

const webhookSchema = z.object({
  from: z.string(),
  message: z.string().min(1),
});

export async function whatsappWebhook(app: FastifyInstance) {
  app.post("/webhook/whatsapp", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // ✅ Verifica assinatura do webhook (HMAC)
      const assinatura = request.headers["x-signature"] as string;
      validarAssinaturaWebhook(request.body, assinatura);

      // ✅ Validação do corpo
      const body = webhookSchema.parse(request.body);
      const userPhone = body.from;
      const message = sanitizeInput(body.message.toLowerCase());

      // 🔎 Só processa se começar com “olá gg finance”
      if (!message.startsWith("olá gg finance") && !message.startsWith("ola gg finance")) {
        logger.info(`Mensagem ignorada de ${mascararTelefone(userPhone)}: ${message}`);
        return reply.status(200).send({ status: "ignored" });
      }

      logger.info(`🤖 Bot ativado por ${mascararTelefone(userPhone)}: ${message}`);
      // 👉 Aqui você chama o controller:
      // await WhatsAppController.receber(request, reply);

      return reply.status(200).send({ status: "received", botActive: true });
    } catch (err: any) {
      logger.error("Erro no webhook WhatsApp", err);
      return reply.status(400).send({ error: err.message || "Invalid payload" });
    }
  });
}
