import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { validarValorTransacao } from "../../utils/seguranca.utils"; // atenção: "util" singular se for seu padrão
import { UsuarioRepository } from "../../repositories/usuario.repository";

export class RegistrarReceitaHandler {
  static async executar(telefone: string, usuarioId: string, valor: number, descricao?: string) {
    // 🔒 1. Garantir que o usuário existe
    const usuario = await UsuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Usuário não encontrado. Faça o cadastro enviando *1*."
      );
    }

    // 🧩 2. Validar o valor
    if (!validarValorTransacao(valor)) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Valor inválido. Digite um número positivo e menor que R$1.000.000,00.\nExemplo: *2 1500*"
      );
    }

    // 🧾 3. Criar a transação no banco
    await TransacaoRepository.criar({
      usuarioId,
      tipo: "receita",
      valor,
      descricao
    });

    // ✅ 4. Confirmar ao usuário
    return EnviadorWhatsApp.enviar(
      telefone,
      `✅ *Receita registrada com sucesso!*\n💰 Valor: R$ ${valor.toFixed(2)}`
    );
  }
}
