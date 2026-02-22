import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { DadosRelatorioMensal } from "../../repositories/relatorioMensal.repository";

export class RelatorioMensalPDFService {
  private static formatar(valor: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  static async gerar(dados: DadosRelatorioMensal): Promise<string> {
    // Cria diretório de relatórios se não existir
    const relatoriosDir = path.join(process.cwd(), "relatorios");
    if (!fs.existsSync(relatoriosDir)) {
      fs.mkdirSync(relatoriosDir, { recursive: true });
    }

    const nomeArquivo = `relatorio_${dados.periodo.ano}_${String(
      dados.periodo.mes
    ).padStart(2, "0")}_${Date.now()}.pdf`;
    const caminhoCompleto = path.join(relatoriosDir, nomeArquivo);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const stream = fs.createWriteStream(caminhoCompleto);

        doc.pipe(stream);

        // ===== CABEÇALHO =====
        doc
          .fontSize(24)
          .fillColor("#1a73e8")
          .text("💰 GG Finance", { align: "center" });

        doc
          .fontSize(18)
          .fillColor("#333")
          .text("Relatório Mensal", { align: "center" });

        doc.moveDown(0.5);

        doc
          .fontSize(12)
          .fillColor("#666")
          .text(
            `${dados.periodo.mesNome} de ${dados.periodo.ano}`,
            { align: "center" }
          );

        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .fillColor("#999")
          .text(`Usuário: ${dados.usuario.nome}`, { align: "center" });

        doc.moveDown(2);

        // ===== RESUMO FINANCEIRO =====
        this.desenharSecao(doc, "📊 RESUMO FINANCEIRO");

        const yInicio = doc.y;

        // Box de Receitas
        this.desenharBox(
          doc,
          50,
          yInicio,
          150,
          80,
          "#4caf50",
          "💰 Receitas",
          this.formatar(dados.resumo.totalReceitas),
          `${dados.resumo.quantidadeReceitas} transações`
        );

        // Box de Despesas
        this.desenharBox(
          doc,
          220,
          yInicio,
          150,
          80,
          "#f44336",
          "💸 Despesas",
          this.formatar(dados.resumo.totalDespesas),
          `${dados.resumo.quantidadeDespesas} transações`
        );

        // Box de Saldo
        const corSaldo = dados.resumo.saldo >= 0 ? "#2196f3" : "#ff9800";
        this.desenharBox(
          doc,
          390,
          yInicio,
          150,
          80,
          corSaldo,
          "📍 Saldo",
          this.formatar(dados.resumo.saldo),
          dados.resumo.saldo >= 0 ? "Positivo" : "Negativo"
        );

        doc.y = yInicio + 100;

        // ===== MAIOR GASTO E RECEITA =====
        if (dados.maiorGasto || dados.maiorReceita) {
          this.desenharSecao(doc, "🔝 DESTAQUES DO MÊS");

          if (dados.maiorGasto) {
            doc
              .fontSize(11)
              .fillColor("#333")
              .text("🔻 Maior Gasto:", { continued: false });

            doc
              .fontSize(10)
              .fillColor("#666")
              .text(
                `   ${dados.maiorGasto.descricao} - ${this.formatar(
                  dados.maiorGasto.valor
                )}`,
                { continued: false }
              );

            doc
              .fontSize(9)
              .fillColor("#999")
              .text(
                `   ${dados.maiorGasto.categoria} • ${dados.maiorGasto.data.toLocaleDateString(
                  "pt-BR"
                )}`,
                { continued: false }
              );

            doc.moveDown(0.5);
          }

          if (dados.maiorReceita) {
            doc
              .fontSize(11)
              .fillColor("#333")
              .text("🔺 Maior Receita:", { continued: false });

            doc
              .fontSize(10)
              .fillColor("#666")
              .text(
                `   ${dados.maiorReceita.descricao} - ${this.formatar(
                  dados.maiorReceita.valor
                )}`,
                { continued: false }
              );

            doc
              .fontSize(9)
              .fillColor("#999")
              .text(
                `   ${dados.maiorReceita.categoria} • ${dados.maiorReceita.data.toLocaleDateString(
                  "pt-BR"
                )}`,
                { continued: false }
              );
          }

          doc.moveDown(1.5);
        }

        // ===== GASTOS POR CATEGORIA =====
        const despesas = dados.categorias.filter((c) => c.tipo === "despesa");
        if (despesas.length > 0) {
          this.desenharSecao(doc, "📂 DESPESAS POR CATEGORIA");

          despesas.forEach((cat, index) => {
            if (index >= 10) return; // Limita a 10 categorias

            const y = doc.y;

            // Nome da categoria
            doc
              .fontSize(10)
              .fillColor("#333")
              .text(cat.nome, 50, y, { width: 200 });

            // Valor
            doc
              .fontSize(10)
              .fillColor("#666")
              .text(this.formatar(cat.total), 260, y, {
                width: 100,
                align: "right",
              });

            // Percentual
            doc
              .fontSize(9)
              .fillColor("#999")
              .text(`${cat.percentual.toFixed(1)}%`, 370, y, {
                width: 60,
                align: "right",
              });

            // Barra de progresso
            const barWidth = (cat.percentual / 100) * 100;
            doc
              .rect(440, y + 3, barWidth, 8)
              .fillColor("#f44336")
              .fill();

            doc.moveDown(0.8);
          });

          doc.moveDown(1);
        }

        // ===== RECEITAS POR CATEGORIA =====
        const receitas = dados.categorias.filter((c) => c.tipo === "receita");
        if (receitas.length > 0) {
          // Verifica se precisa de nova página
          if (doc.y > 650) {
            doc.addPage();
          }

          this.desenharSecao(doc, "📈 RECEITAS POR CATEGORIA");

          receitas.forEach((cat, index) => {
            if (index >= 10) return;

            const y = doc.y;

            doc
              .fontSize(10)
              .fillColor("#333")
              .text(cat.nome, 50, y, { width: 200 });

            doc
              .fontSize(10)
              .fillColor("#666")
              .text(this.formatar(cat.total), 260, y, {
                width: 100,
                align: "right",
              });

            doc
              .fontSize(9)
              .fillColor("#999")
              .text(`${cat.percentual.toFixed(1)}%`, 370, y, {
                width: 60,
                align: "right",
              });

            const barWidth = (cat.percentual / 100) * 100;
            doc
              .rect(440, y + 3, barWidth, 8)
              .fillColor("#4caf50")
              .fill();

            doc.moveDown(0.8);
          });
        }

        // ===== RODAPÉ =====
        doc.moveDown(2);
        doc
          .fontSize(8)
          .fillColor("#999")
          .text(
            `Relatório gerado em ${new Date().toLocaleDateString(
              "pt-BR"
            )} às ${new Date().toLocaleTimeString("pt-BR")}`,
            { align: "center" }
          );

        doc
          .fontSize(8)
          .fillColor("#999")
          .text("GG Finance - Seu assistente financeiro inteligente", {
            align: "center",
          });

        doc.end();

        stream.on("finish", () => {
          resolve(caminhoCompleto);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private static desenharSecao(doc: PDFKit.PDFDocument, titulo: string) {
    doc
      .fontSize(14)
      .fillColor("#1a73e8")
      .text(titulo, { continued: false });

    doc
      .moveTo(50, doc.y + 5)
      .lineTo(545, doc.y + 5)
      .strokeColor("#1a73e8")
      .lineWidth(2)
      .stroke();

    doc.moveDown(1);
  }

  private static desenharBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    cor: string,
    titulo: string,
    valor: string,
    subtitulo: string
  ) {
    // Fundo do box
    doc.rect(x, y, width, height).fillColor("#f5f5f5").fill();

    // Borda colorida no topo
    doc.rect(x, y, width, 4).fillColor(cor).fill();

    // Título
    doc
      .fontSize(9)
      .fillColor("#666")
      .text(titulo, x + 10, y + 15, { width: width - 20, align: "center" });

    // Valor
    doc
      .fontSize(16)
      .fillColor("#333")
      .text(valor, x + 10, y + 35, { width: width - 20, align: "center" });

    // Subtítulo
    doc
      .fontSize(8)
      .fillColor("#999")
      .text(subtitulo, x + 10, y + 60, { width: width - 20, align: "center" });
  }
}
