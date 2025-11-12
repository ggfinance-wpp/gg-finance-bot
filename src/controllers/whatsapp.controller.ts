import { FastifyRequest, FastifyReply } from "fastify";
import { BotService } from "../services/bot.service";

export class WhatsAppController {
  static async receber(req: FastifyRequest, res: FastifyReply) {
    const { from, message } = req.body as any;
    await BotService.processarMensagem(from, message);
    return res.send({ status: "ok" });
  }
}
