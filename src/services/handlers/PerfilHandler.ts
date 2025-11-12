import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";

export class PerfilHandler {
  static async executar(telefone: string, usuarioId: string) {
    const usuario = await UsuarioRepository.buscarPorId(usuarioId);

    if (!usuario) {
      return EnviadorWhatsApp.enviar(
        telefone,
        "⚠️ Não foi possível localizar seu perfil. Envie *1* para se cadastrar novamente."
      );
    }

    const texto = `
👤 *Seu Perfil no GG Finance* 📱

📞 Telefone: ${usuario.telefone}
${usuario.nome ? `🧑 Nome: ${usuario.nome}` : ""}
${usuario.cpfCnpj ? `🪪 CPF/CNPJ: ${usuario.cpfCnpj}` : ""}
🕓 Criado em: ${new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}

💡 Continue usando o GG Finance para acompanhar suas finanças!
    `.trim();

    await EnviadorWhatsApp.enviar(telefone, texto);
  }
}
