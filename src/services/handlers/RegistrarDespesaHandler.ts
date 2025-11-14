import { TransacaoRepository } from "../../repositories/transacao.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { validarValorTransacao } from "../../utils/seguranca.utils";
import { UsuarioRepository } from "../../repositories/usuario.repository";

export class RegistrarDespesaHandler {

  static async executar(
    telefone: string,
    usuarioId: string,
    valor: number,
    descricao?: string,
    agendar?: boolean,               // 👈 vem da IA (true/false)
    dataAgendadaTexto?: string | null, // 👈 vem da IA (string ou null)
    categoriaId?: string
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

    // 🔄 Converter agendar + dataAgendadaTexto → Date | null
    let dataAgendada: Date | null = null;

    if (agendar && dataAgendadaTexto) {
      const parsed = new Date(dataAgendadaTexto);

      // se a data vier num formato que o JS entende
      if (!isNaN(parsed.getTime())) {
        dataAgendada = parsed;
      } else {
        // aqui você pode escolher:
        // - ou tratar como despesa normal (sem agendamento)
        // - ou pedir pro usuário reenviar a data num formato válido
        // Vou optar por pedir novamente, pra não fazer nada "escondido".
        return EnviadorWhatsApp.enviar(
          telefone,
          "📅 Não consegui entender a data que você informou.\n" +
          "Mande novamente no formato *dd/mm/aaaa*.\n\n" +
          "Exemplo: *pagar aluguel dia 10/02/2026*"
        );
      }
    }

    const status = dataAgendada ? "pendente" : "concluida";

    await TransacaoRepository.criar({
      usuarioId,
      tipo: "despesa",
      valor,
      descricao,
      categoriaId: categoriaId ?? null,
      dataAgendada,           // ✅ aqui SEMPRE vai Date ou null
      status
    });

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
      `💸 *Despesa registrada!*\n` +
      `Valor: R$ ${valor.toFixed(2)}`
    );
  }
}
