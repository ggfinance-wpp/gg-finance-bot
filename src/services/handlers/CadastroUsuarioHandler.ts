import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { validarCpfCnpj } from "../../validators/documento.validator";

export class CadastroUsuarioHandler {

  static async executar(telefone: string, mensagem: string) {

    let contexto = await ContextoRepository.obter(telefone);

    if (!contexto) {

      const existe = await UsuarioRepository.buscarPorTelefone(telefone);

      if (existe) {
        return EnviadorWhatsApp.enviar(telefone, "✅ Você já está cadastrado!");
      }

      await ContextoRepository.definir(telefone, "cadastro_nome", {});

      return EnviadorWhatsApp.enviar(
        telefone,
        "👤 Pra começar, me diga seu *nome completo*."
      );
    }

    if (contexto.etapa === "cadastro_nome") {

      let nomeBruto = mensagem.trim();

      const match = nomeBruto.match(/(?:meu nome é|me chamo|sou o|sou a)\s+(.+)/i);
      if (match) nomeBruto = match[1].trim();

      if (
        nomeBruto.includes("?") ||
        /\d/.test(nomeBruto) ||
        nomeBruto.split(/\s+/).length < 2 ||
        nomeBruto.length < 5
      ) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "⚠️ Me envie seu nome completo válido."
        );
      }

      await ContextoRepository.atualizar(telefone, "cadastro_cpf", {
        nome: nomeBruto,
      });

      return EnviadorWhatsApp.enviar(
        telefone,
        "🪪 Agora me envie seu *CPF ou CNPJ*."
      );
    }

    if (contexto.etapa === "cadastro_cpf") {
      const somenteNumeros = mensagem.replace(/\D/g, "");

      if (!validarCpfCnpj(somenteNumeros)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ CPF/CNPJ inválido."
        );
      }

      const dados = contexto.dados as { nome: string };

      await UsuarioRepository.criar({
        nome: dados.nome,
        telefone,
        cpfCnpj: somenteNumeros,
      });

      await ContextoRepository.limpar(telefone);

      return EnviadorWhatsApp.enviar(
        telefone,
        `🎉 Cadastro concluído!\n👤 *${dados.nome}*\n🪪 *${somenteNumeros}*`
      );
    }
  }
}
