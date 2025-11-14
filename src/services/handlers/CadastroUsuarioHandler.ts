import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { ContextoRepository } from "../../repositories/contexto.repository";
import { validarCpfCnpj } from "../../utils/seguranca.utils";

export class CadastroUsuarioHandler {

  static async executar(telefone: string, mensagem: string) {

    // 📌 Buscar contexto no banco
    let contexto = await ContextoRepository.obter(telefone);

    // INÍCIO DO FLUXO
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

    // ETAPA 1: Nome
    if (contexto.etapa === "cadastro_nome") {

      let nomeBruto = mensagem.trim();

      // Tentar extrair nome de frases tipo:
      // "meu nome é Maria Silva", "me chamo João Souza", "sou o Pedro"
      const matchNome = nomeBruto.match(/(?:meu nome é|me chamo|sou o|sou a)\s+(.+)/i);
      if (matchNome) {
        nomeBruto = matchNome[1].trim();
      }

      // 🔎 Validações básicas para evitar nome zoado / resposta que não seja nome
      const temInterrogacao = nomeBruto.includes("?");
      const temNumero = /\d/.test(nomeBruto);
      const partes = nomeBruto.split(/\s+/);
      const temNomeESobrenome = partes.length >= 2;
      const muitoCurto = nomeBruto.length < 5;

      if (temInterrogacao || temNumero || !temNomeESobrenome || muitoCurto) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "⚠️ Só pra confirmar, me envie seu *nome completo verdadeiro* (nome e sobrenome), " +
          "sem abreviações e sem números.\n\nExemplo: *Maria Silva*, *João Pereira* 😉"
        );
      }

      // Se passou nas validações, segue para CPF/CNPJ
      await ContextoRepository.atualizar(telefone, "cadastro_cpf", { nome: nomeBruto });

      return EnviadorWhatsApp.enviar(
        telefone,
        "🪪 Agora me envie seu *CPF ou CNPJ* (somente números)."
      );
    }

    // ETAPA 2: CPF/CNPJ
    if (contexto.etapa === "cadastro_cpf") {

      const cpfCnpj = mensagem.replace(/\D/g, "");

      // validações básicas de formato/tamanho
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ CPF/CNPJ inválido no tamanho. Confira se digitou corretamente e envie novamente (somente números)."
        );
      }

      // bloquear sequências óbvias tipo 00000000000, 11111111111 etc.
      if (/^(\d)\1+$/.test(cpfCnpj)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ Esse CPF/CNPJ não parece válido. Tente novamente com um documento verdadeiro."
        );
      }

      // sua função de validação (dígitos verificadores)
      if (!validarCpfCnpj(cpfCnpj)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ CPF/CNPJ inválido. Confira os números e tente novamente."
        );
      }

      // 👉 Daqui pra frente, a gente **assume** que o documento é válido.
      // Não temos como saber se é dele, só que o número é "correto" matematicamente.

      await UsuarioRepository.criar({
        nome: contexto.dados.nome,
        telefone,
        cpfCnpj
      });

      // remover contexto
      await ContextoRepository.limpar(telefone);

      return EnviadorWhatsApp.enviar(
        telefone,
        `🎉 Cadastro concluído com sucesso!\n` +
        `👤 Nome: *${contexto.dados.nome}*\n🪪 CPF/CNPJ: *${cpfCnpj}*`
      );
    }
  }
}
