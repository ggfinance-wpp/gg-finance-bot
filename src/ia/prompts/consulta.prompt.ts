export const PROMPT_CONSULTA = (mensagem: string) => `
Você interpreta pedidos de consulta financeira.

Identifique apenas UMA das ações abaixo.

────────────────────────────────────────
FORMATO
────────────────────────────────────────
Retorne APENAS JSON válido.

────────────────────────────────────────
AÇÕES
────────────────────────────────────────
{ "acao": "ver_saldo" }
{ "acao": "ver_gastos_por_categoria" }
{ "acao": "ver_gastos_da_categoria", "categoria": string | null }
{ "acao": "ver_receitas_detalhadas" }
{ "acao": "ver_despesas_detalhadas" }
{ "acao": "ver_perfil" }
{ "acao": "ajuda" }

Se não houver intenção clara:
{ "acao": "desconhecido" }

────────────────────────────────────────
MENSAGEM DO USUÁRIO
────────────────────────────────────────
"${mensagem}"
`;
