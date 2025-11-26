import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { validarCpfCnpj } from "../../validators/documento.validator";

export class CadastroUsuarioHandler {

  static async executar(telefone: string, mensagem: string) {

    let contexto = await ContextoRepository.obter(telefone);

    /* ----------------------------------------------------------
     * INÍCIO DO FLUXO — ainda sem contexto
     * ---------------------------------------------------------- */
    if (!contexto) {

      const existe = await UsuarioRepository.buscarPorTelefone(telefone);

      if (existe) {
        return EnviadorWhatsApp.enviar(telefone, "✅ Você já está cadastrado!");
      }

      await ContextoRepository.definir(telefone, "cadastro_nome", {});

      return EnviadorWhatsApp.enviar(
        telefone,
        "👤 Pra começar, me diga seu *nome completo* (nome e sobrenome)."
      );
    }

    /* ----------------------------------------------------------
     * ETAPA 1 — Nome do usuário
     * ---------------------------------------------------------- */
    if (contexto.etapa === "cadastro_nome") {

      let nomeBruto = mensagem.trim();

      // Aceitar frases como "me chamo João", "sou Maria Silva"
      const match = nomeBruto.match(/(?:meu nome é|me chamo|sou o|sou a)\s+(.+)/i);
      if (match) {
        nomeBruto = match[1].trim();
      }

      // Validação mínima para evitar resposta inválida
      if (
        nomeBruto.includes("?") ||
        /\d/.test(nomeBruto) ||
        nomeBruto.split(/\s+/).length < 2 ||
        nomeBruto.length < 5
      ) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "⚠️ Só para confirmar, me envie seu *nome completo verdadeiro* (nome e sobrenome), sem números e sem abreviações.\n\nExemplo: *Maria Silva*, *João Pereira*."
        );
      }

      await ContextoRepository.atualizar(telefone, "cadastro_cpf", { nome: nomeBruto });

      return EnviadorWhatsApp.enviar(
        telefone,
        "🪪 Agora me envie seu *CPF ou CNPJ* (somente números)."
      );
    }

    /* ----------------------------------------------------------
     * ETAPA 2 — CPF/CNPJ
     * ---------------------------------------------------------- */
    if (contexto.etapa === "cadastro_cpf") {

      const somenteNumeros = mensagem.replace(/\D/g, "");

      // Agora TODA a validação fica no validador oficial
      if (!validarCpfCnpj(somenteNumeros)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ CPF/CNPJ inválido. Confira os números e envie novamente (somente dígitos)."
        );
      }

      // Criar usuário
      await UsuarioRepository.criar({
        nome: contexto.dados.nome,
        telefone,
        cpfCnpj: somenteNumeros
      });

      await ContextoRepository.limpar(telefone);

      return EnviadorWhatsApp.enviar(
        telefone,
        `🎉 Cadastro concluído com sucesso!\n\n` +
        `👤 Nome: *${contexto.dados.nome}*\n` +
        `🪪 CPF/CNPJ: *${somenteNumeros}*`
      );
    }
  }
}
