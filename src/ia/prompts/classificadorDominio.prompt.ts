export const CLASSIFICADOR_DOMINIO_PROMPT = (mensagem: string) => `
Classifique a mensagem do usuário em UM domínio principal.

Domínios possíveis:
- financeiro
- lembrete
- consulta
- outro

REGRAS IMPORTANTES:
- Classifique como "financeiro" quando houver:
  • entrada ou saída de dinheiro
  • valores numéricos
  • verbos como: receber, ganho, gasto, pagar, salário
- Considere como FINANCEIRO mesmo sem a palavra "mensal" se houver:
  • "todo dia X"
  • "dia X útil"
  • "sempre no dia"
  • "recebo X dia Y"
  • qualquer padrão recorrente implícito
- Use "lembrete" apenas para eventos pontuais (conta, compromisso, aviso único)

Responda APENAS em JSON válido:
{ "dominio": "..." }

Mensagem:
"${mensagem}"
`;
