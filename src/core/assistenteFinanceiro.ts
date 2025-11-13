import { InterpretadorGemini } from "../ia/interpretadorGemini";
import { RespostaGemini } from "../ia/respostaGemini";

import { RegistrarDespesaHandler } from "../services/handlers/RegistrarDespesaHandler";
import { RegistrarReceitaHandler } from "../services/handlers/RegistrarReceitaHandler";
import { CadastroUsuarioHandler } from "../services/handlers/CadastroUsuarioHandler";
import { RelatorioHandler } from "../services/handlers/RelatorioHandler";
import { PerfilHandler } from "../services/handlers/PerfilHandler";

import { UsuarioRepository } from "../repositories/usuario.repository";
import { EnviadorWhatsApp } from "../services/EnviadorWhatsApp";

export class AssistenteFinanceiro {
    static async processar(telefone: string, mensagem: string) {

        const usuario = await UsuarioRepository.buscarPorTelefone(telefone);

        // 1. Interpretar intenção usando IA
        const intent = await InterpretadorGemini.interpretarMensagem(mensagem, { usuario });
        console.log("IA interpretou:", intent);

        // 2. Caso o usuário NÃO esteja cadastrado e a IA detecte algo que exige cadastro
        const acoesQueExigemUsuario = [
            "registrar_despesa",
            "registrar_receita",
            "ver_saldo",
            "ver_perfil"
        ];

        if (!usuario && acoesQueExigemUsuario.includes(intent.acao)) {
            const texto = await RespostaGemini.gerar(`
O usuário tentou executar "${intent.acao}", mas ainda não possui cadastro.
Peça o nome completo dele de maneira educada.
`);
            await EnviadorWhatsApp.enviar(telefone, texto);

            return CadastroUsuarioHandler.executar(telefone, mensagem);
        }

        // 3. Usuário quer se cadastrar
        if (intent.acao === "cadastro_usuario" || intent.acao === "cadastrar_usuario") {
            return CadastroUsuarioHandler.executar(telefone, mensagem);
        }

        // 4. Fluxos que exigem usuário EXISTENTE
        switch (intent.acao) {

            case "registrar_despesa":
                return RegistrarDespesaHandler.executar(
                    telefone,
                    usuario!.id,
                    intent.valor,
                    intent.descricao
                );

            case "registrar_receita":
                return RegistrarReceitaHandler.executar(
                    telefone,
                    usuario!.id,
                    intent.valor,
                    intent.descricao
                );

            case "ver_saldo":
                return RelatorioHandler.executar(telefone, usuario!.id);

            case "ver_perfil":
                return PerfilHandler.executar(telefone, usuario!.id);
        }

        // 5. Se a IA não entendeu a ação
        const resposta = await RespostaGemini.gerar(`
O usuário enviou: "${mensagem}" 
A intenção não ficou clara. Sugira opções como registrar despesa, receita, ver saldo, cadastro, etc.
`);

        return EnviadorWhatsApp.enviar(telefone, resposta);
    }
}
