import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class RelatorioHandler {
  static async executar(telefone: string, usuarioId: string) {
    const { receitas, despesas, saldo } = await TransacaoRepository.extrato(usuarioId);

    const texto = `
📊 *RELATÓRIO FINANCEIRO*

💰 Receitas:  R$ ${receitas.toFixed(2)}
💸 Despesas:  R$ ${despesas.toFixed(2)}
📍 Saldo:     R$ ${saldo.toFixed(2)}

🧾 Continue registrando para acompanhar sua saúde financeira!
    `.trim();

    await EnviadorWhatsApp.enviar(telefone, texto);
  }
}
