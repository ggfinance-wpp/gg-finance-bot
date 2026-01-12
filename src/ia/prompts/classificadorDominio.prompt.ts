export const CLASSIFICADOR_DOMINIO_PROMPT = (mensagem: string) => `
Classifique a mensagem do usuário em UM domínio principal.

Domínios possíveis:
- financeiro
- lembrete
- consulta
- outro

Responda APENAS em JSON válido:
{ "dominio": "..." }

Mensagem:
"${mensagem}"
`;
