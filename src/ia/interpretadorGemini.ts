import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export class InterpretadorGemini {

  static async interpretarMensagem(mensagem: string, contexto: any = {}) {

    const prompt = `
Você é um interpretador de intenções para um assistente financeiro no WhatsApp.
Sua função é ler a mensagem do usuário e **retornar SOMENTE um JSON válido**, simples e limpo.

⚠️ IMPORTANTE:
- NÃO escreva explicações.
- NÃO coloque texto fora do JSON.
- NÃO utilize comentários.
- NÃO quebre o formato.
- Se não entender a intenção, retorne:
{ "acao": "desconhecido" }

📌 INTENÇÕES SUPORTADAS:

1. registrar_receita
{
  "acao": "registrar_receita",
  "valor": number,
  "descricao": string | null
}

2. registrar_despesa
{
  "acao": "registrar_despesa",
  "valor": number,
  "descricao": string | null
}

3. ver_saldo
{ "acao": "ver_saldo" }

4. ver_perfil
{ "acao": "ver_perfil" }

5. cadastrar_usuario
{
  "acao": "cadastrar_usuario",
  "dados": {
    "nome": string | null,
    "cpf": string | null
  }
}

6. ajuda
{ "acao": "ajuda" }

7. desconhecido
{ "acao": "desconhecido" }

📌 EXTRAÇÕES AUTOMÁTICAS QUE VOCÊ DEVE FAZER:
- Valores como: "50", "50.5", "R$50", "R$ 50,90", "50 reais", etc.
- Descrição livre: tudo após o valor (ex.: "mercado", "aluguel", "freelancer", etc.)
- Nome completo quando o usuário se apresentar: "meu nome é João Pereira".
- CPF/CNPJ se o usuário enviar: "12345678900".
- Intenções implícitas (ex.: "gastei 40 no mercado" = registrar_despesa).

📌 CONTEXTO DO USUÁRIO DISPONÍVEL:
${JSON.stringify(contexto)}

📩 MENSAGEM DO USUÁRIO:
"${mensagem}"

Agora retorne **APENAS** o JSON correspondente.
    `;

    const resposta = await modelo.generateContent(prompt);
    const texto = resposta.response.text().trim();

    try {
      return JSON.parse(texto);
    } catch (e) {
      console.error("Erro ao interpretar JSON da IA:", texto);
      return { acao: "desconhecido" };
    }
  }
}
