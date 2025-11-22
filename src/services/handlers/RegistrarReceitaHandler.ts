import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { validarValorTransacao } from "../../utils/seguranca.utils";
import { UsuarioRepository } from "../../repositories/usuario.repository";
import { CategoriaAutoService } from "../CategoriaAutoService";

export class RegistrarReceitaHandler {

  static async executar(
    telefone: string,
    usuarioId: string,
    valor: number,
    descricao?: string,
    dataAgendada?: Date | null,
    categoriaNome?: string
  ) {

    const usuario = await UsuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Usuário não encontrado. Faça o cadastro enviando *1*."
      );
    }

    if (!validarValorTransacao(valor)) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "❌ Valor inválido. Digite um número positivo.\nExemplo: *1500*"
      );
    }

    // -------------------------------
    // 📌 Categoria automática
    // -------------------------------
    const categoriaId = await CategoriaAutoService.resolver(
      usuarioId,
      categoriaNome ?? null,
      "receita"
    );

    // -------------------------------
    // 📌 Criar transação
    // -------------------------------
    await TransacaoRepository.criar({
      usuarioId,
      tipo: "receita",
      valor,
      descricao: descricao ?? "Receita sem descrição",
      categoriaId,
      dataAgendada: dataAgendada ?? null,
      status: dataAgendada ? "pendente" : "concluida"
    });

    // -------------------------------
    // 📌 Resposta ao usuário
    // -------------------------------
    if (dataAgendada) {
      return EnviadorWhatsApp.enviar(
        telefone,
        `📅 *Receita agendada!*  
💰 Valor: R$ ${valor.toFixed(2)}  
🔔 Para ${dataAgendada.toLocaleDateString("pt-BR")}`
      );
    }

    return EnviadorWhatsApp.enviar(
      telefone,
      `✅ *Receita registrada!*  
💰 Valor: R$ ${valor.toFixed(2)}`
    );
  }
}
