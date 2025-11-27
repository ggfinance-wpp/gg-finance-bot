import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { validarValorTransacao } from "../../utils/seguranca.utils";
import { UsuarioRepository } from "../../repositories/usuario.repository";
import { CategoriaRepository } from "../../repositories/categoria.repository"; // <-- importante

export class RegistrarDespesaHandler {

  static async executar(
    telefone: string,
    usuarioId: string,
    valor: number,
    descricao?: string,
    agendar?: boolean,
    dataAgendadaTexto?: string | null,
    categoriaId?: string | null
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
        "❌ Valor inválido. Digite algo como 25, 100, 350.90...\nExemplo: *300 mercado*"
      );
    }

    // ---------------------------------------------------------
    // 📌 1) SE O USUÁRIO NÃO INFORMAR CATEGORIA → usar “Outros”
    // ---------------------------------------------------------
    if (!categoriaId) {
      let categoria = await CategoriaRepository.buscarPorNome(usuarioId, "Outros");

      if (!categoria) {
        categoria = await CategoriaRepository.criar({
          usuarioId,
          nome: "Outros",
          tipo: "despesa"
        });
      }

      categoriaId = categoria.id;
    }

    // ---------------------------------------------------------
    // 📌 2) TRATAR AGENDAMENTO
    // ---------------------------------------------------------
    let dataAgendada: Date | null = null;

    if (agendar && dataAgendadaTexto) {
      const parsed = new Date(dataAgendadaTexto);

      if (!isNaN(parsed.getTime())) {
        dataAgendada = parsed;
      } else {
        return EnviadorWhatsApp.enviar(
          telefone,
          "📅 Não consegui entender a data que você informou.\n" +
          "Mande novamente no formato *dd/mm/aaaa*.\n\n" +
          "Exemplo: *pagar aluguel dia 10/02/2026*"
        );
      }
    }

    const status = dataAgendada ? "pendente" : "concluida";

    // ---------------------------------------------------------
    // 📌 3) SALVAR DESPESA
    // ---------------------------------------------------------
    await TransacaoRepository.criar({
      usuarioId,
      tipo: "despesa",
      valor,
      descricao: descricao ?? undefined,
      categoriaId,
      data: new Date(),              // 👈 obrigatório
      dataAgendada,
      status
    });

    // ---------------------------------------------------------
    // 📌 4) RESPOSTA
    // ---------------------------------------------------------
    if (dataAgendada) {
      return EnviadorWhatsApp.enviar(
        telefone,
        `📅 *Despesa agendada!*\n` +
        `💸 Valor: R$ ${valor.toFixed(2)}\n` +
        `🔔 Vou te lembrar em *${dataAgendada.toLocaleDateString("pt-BR")}*`
      );
    }

    return EnviadorWhatsApp.enviar(
      telefone,
      `💸 *Despesa registrada!*\nValor: R$ ${valor.toFixed(2)}`
    );
  }
}
