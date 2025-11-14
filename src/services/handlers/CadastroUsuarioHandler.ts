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
                "👤 Qual é o seu *nome completo*?"
            );
        }

        // ETAPA 1: Nome
        if (contexto.etapa === "cadastro_nome") {

            await ContextoRepository.atualizar(telefone, "cadastro_cpf", { nome: mensagem });


            return EnviadorWhatsApp.enviar(
                telefone,
                "🪪 Informe seu *CPF ou CNPJ* (somente números)."
            );
        }

        // ETAPA 2: CPF/CNPJ
        if (contexto.etapa === "cadastro_cpf") {

            const cpfCnpj = mensagem.replace(/\D/g, "");

            if (!validarCpfCnpj(cpfCnpj)) {
                return EnviadorWhatsApp.enviar(
                    telefone,
                    "❌ CPF/CNPJ inválido. Tente novamente."
                );
            }

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
