import { InterpretadorGemini } from "../ia/interpretadorGemini";
import { RespostaGemini } from "../ia/respostaGemini";

import { RegistrarDespesaHandler } from "../services/handlers/RegistrarDespesaHandler";
import { RegistrarReceitaHandler } from "../services/handlers/RegistrarReceitaHandler";
import { CategoriaHandler } from "../services/handlers/CategoriaHandler";
import { LembreteHandler } from "../services/handlers/LembreteHandler";
import { AgendamentoHandler } from "../services/handlers/AgendamentoHandler";
import { EditarTransacaoHandler } from "../services/handlers/EditarTransacaoHandler";
import { ExcluirTransacaoHandler } from "../services/handlers/ExcluirTransacaoHandler";

import { RelatorioHandler } from "../services/handlers/RelatorioHandler";
import { PerfilHandler } from "../services/handlers/PerfilHandler";
import { CadastroUsuarioHandler } from "../services/handlers/CadastroUsuarioHandler";

import { UsuarioRepository } from "../repositories/usuario.repository";
import { ContextoRepository } from "../repositories/contexto.repository";
import { EnviadorWhatsApp } from "../services/EnviadorWhatsApp";


export class AssistenteFinanceiro {

    static async processar(telefone: string, mensagem: string) {

        const usuario = await UsuarioRepository.buscarPorTelefone(telefone);
        const contexto = await ContextoRepository.obter(telefone);

        // Se há etapa em andamento → continuar fluxo
        if (contexto) {
            const etapa = contexto.etapa;

            switch (etapa) {

                case "criando_categoria_nome":
                    return CategoriaHandler.salvarNome(telefone, mensagem);

                case "criando_categoria_tipo":
                    return CategoriaHandler.salvarTipo(telefone, mensagem, usuario!.id);

                case "informar_data_agendada":
                    return AgendamentoHandler.salvarData(telefone, mensagem, usuario!.id);

                case "criando_lembrete_texto":
                    return LembreteHandler.salvarTexto(telefone, mensagem);

                case "criando_lembrete_data":
                    return LembreteHandler.salvarData(telefone, mensagem, usuario!.id);

                case "editar_transacao_id":
                    return EditarTransacaoHandler.selecionar(telefone, mensagem);

                case "editar_transacao_opcao":

                    if (mensagem.startsWith("1"))
                        return EditarTransacaoHandler.editarValor(telefone, Number(mensagem));

                    if (mensagem.startsWith("2"))
                        return EditarTransacaoHandler.editarDescricao(telefone, mensagem);

                case "excluir_transacao_id":
                    return ExcluirTransacaoHandler.confirmar(telefone, mensagem);

                case "confirmar_exclusao":
                    return ExcluirTransacaoHandler.executar(telefone, mensagem);
            }
        }


        // Se não há etapa em andamento → Interpretar intenção com IA
        const intent = await InterpretadorGemini.interpretarMensagem(mensagem, { usuario });
        console.log("IA:", intent);

        // Usuário precisa estar cadastrado
        const requerCadastro = [
            "registrar_despesa",
            "registrar_receita",
            "criar_categoria",
            "editar_transacao",
            "excluir_transacao",
            "criar_lembrete",
            "ver_saldo",
            "ver_perfil"
        ];

        if (!usuario && requerCadastro.includes(intent.acao)) {
            await EnviadorWhatsApp.enviar(telefone, "Para continuar, preciso do seu nome completo 🙂");
            return CadastroUsuarioHandler.executar(telefone, mensagem);
        }


        // ROTAS PRINCIPAIS
        switch (intent.acao) {

            case "registrar_despesa":
                return RegistrarDespesaHandler.executar(
                    telefone,
                    usuario!.id,
                    intent.valor,
                    intent.descricao,
                    intent.agendar,
                    intent.dataAgendada
                );

            case "registrar_receita":
                return RegistrarReceitaHandler.executar(
                    telefone,
                    usuario!.id,
                    intent.valor,
                    intent.descricao,
                    intent.agendar,
                    intent.dataAgendada
                );

            case "criar_categoria":
                return CategoriaHandler.iniciarCriacao(telefone);

            case "criar_lembrete":
                return LembreteHandler.iniciar(telefone);

            case "criar_recorrencia":
                // handler a parte (posso criar se quiser)
                break;

            case "editar_transacao":
                return EditarTransacaoHandler.iniciar(telefone);

            case "excluir_transacao":
                return ExcluirTransacaoHandler.iniciar(telefone);

            case "ver_saldo":
                return RelatorioHandler.executar(telefone, usuario!.id);

            case "ver_perfil":
                return PerfilHandler.executar(telefone, usuario!.id);

            case "cadastrar_usuario":
                return CadastroUsuarioHandler.executar(telefone, mensagem);

            case "ajuda":
                return EnviadorWhatsApp.enviar(
                    telefone,
                    "📌 Você pode:\n- Registrar receitas\n- Registrar despesas\n- Criar categorias\n- Ver saldo\n- Criar lembretes\n- Editar ou excluir transações\n\nO que deseja fazer?"
                );
        }

        // DESCONHECIDO
        const resposta = await RespostaGemini.gerar(`
O usuário enviou: "${mensagem}"
Sugira ações como: registrar despesa, receita, criar categoria, lembrete, ver saldo.
`);
        return EnviadorWhatsApp.enviar(telefone, resposta);
    }
}
