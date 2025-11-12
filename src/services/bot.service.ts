import { BoasVindasHandler } from "./handlers/BoasVindasHandler";
import { CadastroUsuarioHandler } from "./handlers/CadastroUsuarioHandler";
import { RegistrarReceitaHandler } from "./handlers/RegistrarReceitaHandler";
import { RegistrarDespesaHandler } from "./handlers/RegistrarDespesaHandler";
import { RelatorioHandler } from "./handlers/RelatorioHandler";
import { PerfilHandler } from "./handlers/PerfilHandler";
import { validarValorTransacao, sanitizeInput } from "../utils/seguranca.utils";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { EnviadorWhatsApp } from "./EnviadorWhatsApp";
import { normalizarTelefone } from "../utils/normalizaTelefone";
import { ConversaRepository } from "../repositories/conversa.repository";

export class BotService {
  static async processarMensagem(telefone: string, mensagem: string) {
    const texto = sanitizeInput(mensagem.toLowerCase().trim());

    // 1️⃣ Garante que o usuário existe (ou pede cadastro)
    const telefoneNormalizado = normalizarTelefone(telefone);
    let usuario = await UsuarioRepository.buscarPorTelefone(telefoneNormalizado);
    // Se usuário ainda não existe e não está tentando cadastrar
    if (!usuario && texto !== "1" && !texto.includes("ola gg finance")) {
      await EnviadorWhatsApp.enviar(
        telefone,
        "👋 Olá! Parece que você ainda não tem cadastro.\nEnvie *1* para se registrar no GG Finance."
      );
      return;
    }

    // 2️⃣ Boas-vindas
    if (texto.includes("ola gg finance")) {
      return BoasVindasHandler.executar(telefone);
    }

    // 3️⃣ Cadastro de usuário
    if (texto === "1" || ConversaRepository.obter(telefone)) {
      return CadastroUsuarioHandler.executar(telefone, texto !== "1" ? texto : undefined);
    }


    // 4️⃣ Registrar receita
    if (texto.startsWith("2")) {
      const valor = Number(texto.split(" ")[1]);
      if (!validarValorTransacao(valor)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ Valor inválido. Digite por exemplo: *2 1500*"
        );
      }

      // ✅ só chama se o usuário existir
      if (usuario) {
        return RegistrarReceitaHandler.executar(telefone, usuario.id, valor);
      }
    }

    // 5️⃣ Registrar despesa
    if (texto.startsWith("3")) {
      const valor = Number(texto.split(" ")[1]);
      if (!validarValorTransacao(valor)) {
        return EnviadorWhatsApp.enviar(
          telefone,
          "❌ Valor inválido. Digite por exemplo: *3 400*"
        );
      }

      if (usuario) {
        return RegistrarDespesaHandler.executar(telefone, usuario.id, valor);
      }
    }

    // 6️⃣ Relatório
    if (texto === "4" && usuario) {
      return RelatorioHandler.executar(telefone, usuario.id);
    }

    // 7️⃣ Perfil
    if (texto === "5" && usuario) {
      return PerfilHandler.executar(telefone, usuario.id);
    }

    // 8️⃣ Caso não entenda a mensagem
    await EnviadorWhatsApp.enviar(
      telefone,
      "🤔 Não entendi seu comando. Envie *olá gg finance* para ver o menu novamente."
    );
  }
}
