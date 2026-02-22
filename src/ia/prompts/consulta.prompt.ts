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
{ "acao": "relatorio_mensal", "mes": number | null, "ano": number | null }
{ "acao": "ajuda" }

NOTA sobre relatório mensal:
- Se usuário pedir "relatório mensal", "relatório do mês", "fechamento mensal"
- "mes" e "ano" devem ser extraídos se mencionados (ex: "janeiro" = 1, "fevereiro" = 2)
- Se não especificado, deixe null (sistema usa mês anterior)

Se não houver intenção clara:
{ "acao": "desconhecido" }

────────────────────────────────────────
MENSAGEM DO USUÁRIO
────────────────────────────────────────
"${mensagem}"
`;
