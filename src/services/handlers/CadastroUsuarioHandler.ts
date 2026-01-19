import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { validarCpfCnpj } from "../../validators/documento.validator";

export class CadastroUsuarioHandler {

  static async executar(userId: string, mensagem: string) {

    const telefone = userId.replace(/@(c\.us|lid)$/, "");


    let contexto = await ContextoRepository.obter(userId);

    // 🟡 INÍCIO DO CADASTRO
    if (!contexto) {

      const existe = await UsuarioRepository.buscarPorUserId(userId);

      if (existe) {
        return EnviadorWhatsApp.enviar(
          userId,
          "✅ Você já está cadastrado!"
        );
      }

      await ContextoRepository.definir(userId, "cadastro_nome", {});

      return EnviadorWhatsApp.enviar(
        userId,
        "👤 Pra começar, me diga seu *nome completo*."
      );
    }

    // 🟡 ETAPA: NOME
    if (contexto.etapa === "cadastro_nome") {

      let nomeBruto = mensagem.trim();

      const match = nomeBruto.match(
        /(?:meu nome é|me chamo|sou o|sou a)\s+(.+)/i
      );
      if (match) nomeBruto = match[1].trim();

      if (
        nomeBruto.includes("?") ||
        /\d/.test(nomeBruto) ||
        nomeBruto.split(/\s+/).length < 2 ||
        nomeBruto.length < 5
      ) {
        return EnviadorWhatsApp.enviar(
          userId,
          "⚠️ Me envie seu nome completo válido."
        );
      }

      await ContextoRepository.atualizar(userId, "cadastro_cpf", {
        nome: nomeBruto,
      });

      return EnviadorWhatsApp.enviar(
        userId,
        "🪪 Agora me envie seu *CPF ou CNPJ*."
      );
    }

    // 🟡 ETAPA: CPF / CNPJ
    if (contexto.etapa === "cadastro_cpf") {

      const somenteNumeros = mensagem.replace(/\D/g, "");

      if (!validarCpfCnpj(somenteNumeros)) {
        return EnviadorWhatsApp.enviar(
          userId,
          "❌ CPF/CNPJ inválido."
        );
      }

      const dados = contexto.dados as { nome: string };

      await UsuarioRepository.criar({
        userId,               // 🔑 OBRIGATÓRIO
        nome: dados.nome,
        telefone,             // null se @lid
        cpfCnpj: somenteNumeros
      });

      await ContextoRepository.limpar(userId);

      return EnviadorWhatsApp.enviar(
        userId,
        `🎉 Cadastro concluído!\n👤 *${dados.nome}*\n🪪 *${somenteNumeros}*`
      );
    }
  }
}
