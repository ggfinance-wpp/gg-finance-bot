export class LembreteClassifier {

  static classificar(texto: string): "receita" | "despesa" {
    if (!texto) return "despesa";

    texto = texto.toLowerCase();

    const termosReceita = [
      "receber", "recebimento", "entrada", "salário", "salario",
      "pix", "deposito", "depósito", "bonus", "bônus", "ganhar",
      "ganhei", "recebo", "cobrar", "cobra"
    ];

    const termosDespesa = [
      "pagar", "pagamento", "vencer", "boleto", "conta",
      "aluguel", "card", "cartão", "cartao", "fatura",
      "emprestimo", "empréstimo", "dever", "quitacao",
      "quitação", "vencimento"
    ];

    if (termosReceita.some(t => texto.includes(t))) return "receita";
    return "despesa";
  }
}
