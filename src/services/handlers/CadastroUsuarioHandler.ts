import { UsuarioRepository } from "../../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../EnviadorWhatsApp";
import { ConversaRepository } from "../../repositories/conversa.repository";
import { validarCpfCnpj } from "../../utils/seguranca.utils";

export class CadastroUsuarioHandler {
    static async executar(telefone: string, mensagem?: string) {
        const estado = ConversaRepository.obter(telefone);

        // Etapa 1: início do cadastro
        if (!estado) {
            const existe = await UsuarioRepository.buscarPorTelefone(telefone);
            if (existe) {
                return EnviadorWhatsApp.enviar(telefone, "✅ Você já está cadastrado!");
            }

            ConversaRepository.definirEtapa(telefone, "aguardando_nome");
            return EnviadorWhatsApp.enviar(telefone, "👤 Qual é o seu *nome completo*?");
        }

        // Etapa 2: recebeu nome, pede CPF
        if (estado.etapa === "aguardando_nome" && mensagem) {
            ConversaRepository.definirEtapa(telefone, "aguardando_cpf", { nome: mensagem });
            return EnviadorWhatsApp.enviar(telefone, "🪪 Informe seu *CPF ou CNPJ* (somente números).");
        }

        // Etapa 3: recebeu CPF, cria o usuário
        if (estado.etapa === "aguardando_cpf" && mensagem) {
            const nome = estado.dadosParciais?.nome ?? "Usuário";
            const cpfCnpj = mensagem.replace(/\D/g, "");
            if (!validarCpfCnpj(cpfCnpj)) {
                return EnviadorWhatsApp.enviar(telefone, "❌ CPF/CNPJ inválido. Tente novamente.");
            }

            await UsuarioRepository.criar({
                nome,
                telefone,
                cpfCnpj,
            });

            ConversaRepository.limpar(telefone);

            return EnviadorWhatsApp.enviar(
                telefone,
                `🎉 Cadastro concluído com sucesso!\n👤 Nome: *${nome}*\n🪪 CPF/CNPJ: *${cpfCnpj}*`
            );
        }
    }
}
