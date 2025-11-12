import { EnviadorWhatsApp } from "./EnviadorWhatsApp";
import { CadastroUsuarioHandler } from "./handlers/CadastroUsuarioHandler";
import { RegistrarReceitaHandler } from "./handlers/RegistrarReceitaHandler";
import { RegistrarDespesaHandler } from "./handlers/RegistrarDespesaHandler";
import { RelatorioHandler } from "./handlers/RelatorioHandler";
import { PerfilHandler } from "./handlers/PerfilHandler";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { validarValorTransacao, sanitizeInput } from "../utils/seguranca.utils";
import { ConversaRepository } from "../repositories/conversa.repository"; // 👈 IMPORTANTE

export class OrquestradorConversa {
  static async processar(telefone: string, mensagem: string) {
    const texto = sanitizeInput(mensagem.toLowerCase().trim());
    console.log(`📨 Mensagem recebida de ${telefone}: "${mensagem}"`);

    // 🔹 1️⃣ Verifica se há uma conversa ativa (ex: cadastro em andamento)
    const conversa = await ConversaRepository.obter(telefone);
    if (conversa) {
      console.log(`🧭 Etapa ativa: ${conversa.etapa}`);

      // Se está em um fluxo de cadastro, delega para o handler
      if (conversa.etapa?.startsWith("aguardando_")) {
        return CadastroUsuarioHandler.executar(telefone, mensagem);
      }
    }

    // 🔹 2️⃣ Verifica se o usuário já existe
    const usuario = await UsuarioRepository.buscarPorTelefone(telefone);

    // Se não existe e não é tentativa de cadastro
    if (!usuario && texto !== "1" && !texto.includes("ola gg finance")) {
      await EnviadorWhatsApp.enviar(
        telefone,
        "👋 Olá! Parece que você ainda não tem cadastro.\nEnvie *1* para se registrar no GG Finance."
      );
      return;
    }

    // 🔹 3️⃣ Menu inicial
    if (texto.includes("olá gg finance") || texto.includes("ola gg finance")) {
      await EnviadorWhatsApp.enviar(telefone, `👋 Olá! Bem-vindo ao *GG Finance* 💰

O que deseja fazer?

1️⃣ Me cadastrar
2️⃣ Registrar receita
3️⃣ Registrar despesa
4️⃣ Ver saldo
5️⃣ Ajuda`);
      return;
    }

    // 🔹 4️⃣ Cadastro
    if (texto === "1") {
      return CadastroUsuarioHandler.executar(telefone, mensagem);
    }

    // 🔹 5️⃣ Registrar receita
    if (texto.startsWith("2")) {
      const valor = Number(texto.split(" ")[1]);
      if (!validarValorTransacao(valor)) {
        return EnviadorWhatsApp.enviar(telefone, "❌ Valor inválido. Exemplo: *2 1500*");
      }

      if (usuario) {
        return RegistrarReceitaHandler.executar(telefone, usuario.id, valor);
      }
    }

    // 🔹 6️⃣ Registrar despesa
    if (texto.startsWith("3")) {
      const valor = Number(texto.split(" ")[1]);
      if (!validarValorTransacao(valor)) {
        return EnviadorWhatsApp.enviar(telefone, "❌ Valor inválido. Exemplo: *3 400*");
      }

      if (usuario) {
        return RegistrarDespesaHandler.executar(telefone, usuario.id, valor);
      }
    }

    // 🔹 7️⃣ Ver saldo
    if (texto === "4" && usuario) {
      return RelatorioHandler.executar(telefone, usuario.id);
    }

    // 🔹 8️⃣ Perfil / Ajuda
    if (texto === "5" && usuario) {
      return PerfilHandler.executar(telefone, usuario.id);
    }

    // 🔹 9️⃣ Caso não entenda
    await EnviadorWhatsApp.enviar(
      telefone,
      "🤔 Não entendi seu comando. Envie *olá gg finance* para ver o menu novamente."
    );
  }
}
