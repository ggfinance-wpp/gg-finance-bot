import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { DadosRelatorioMensal } from "../../repositories/relatorioMensal.repository";

export class RelatorioMensalExcelService {
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
    ).padStart(2, "0")}_${Date.now()}.xlsx`;
    const caminhoCompleto = path.join(relatoriosDir, nomeArquivo);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GG Finance";
    workbook.created = new Date();

    // ===== ABA 1: RESUMO =====
    const sheetResumo = workbook.addWorksheet("Resumo", {
      properties: { tabColor: { argb: "FF1A73E8" } },
    });

    // Cabeçalho
    sheetResumo.mergeCells("A1:F1");
    const cellTitulo = sheetResumo.getCell("A1");
    cellTitulo.value = "💰 GG FINANCE - RELATÓRIO MENSAL";
    cellTitulo.font = { size: 18, bold: true, color: { argb: "FF1A73E8" } };
    cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
    sheetResumo.getRow(1).height = 30;

    sheetResumo.mergeCells("A2:F2");
    const cellPeriodo = sheetResumo.getCell("A2");
    cellPeriodo.value = `${dados.periodo.mesNome} de ${dados.periodo.ano}`;
    cellPeriodo.font = { size: 14, bold: true };
    cellPeriodo.alignment = { horizontal: "center" };

    sheetResumo.mergeCells("A3:F3");
    const cellUsuario = sheetResumo.getCell("A3");
    cellUsuario.value = `Usuário: ${dados.usuario.nome}`;
    cellUsuario.font = { size: 11, italic: true };
    cellUsuario.alignment = { horizontal: "center" };

    sheetResumo.addRow([]);

    // Resumo Financeiro
    sheetResumo.addRow(["📊 RESUMO FINANCEIRO"]).font = {
      size: 14,
      bold: true,
      color: { argb: "FF1A73E8" },
    };
    sheetResumo.addRow([]);

    // Headers do resumo
    const headerResumo = sheetResumo.addRow([
      "Métrica",
      "Valor",
      "Quantidade",
      "Média",
    ]);
    headerResumo.font = { bold: true };
    headerResumo.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE3F2FD" },
    };
    headerResumo.alignment = { horizontal: "center" };

    // Dados do resumo
    const mediaReceitas =
      dados.resumo.quantidadeReceitas > 0
        ? dados.resumo.totalReceitas / dados.resumo.quantidadeReceitas
        : 0;

    const mediaDespesas =
      dados.resumo.quantidadeDespesas > 0
        ? dados.resumo.totalDespesas / dados.resumo.quantidadeDespesas
        : 0;

    sheetResumo.addRow([
      "💰 Receitas",
      dados.resumo.totalReceitas,
      dados.resumo.quantidadeReceitas,
      mediaReceitas,
    ]);

    sheetResumo.addRow([
      "💸 Despesas",
      dados.resumo.totalDespesas,
      dados.resumo.quantidadeDespesas,
      mediaDespesas,
    ]);

    sheetResumo.addRow([
      "📍 Saldo",
      dados.resumo.saldo,
      "-",
      "-",
    ]);

    // Formatação de valores
    sheetResumo.getColumn(2).numFmt = 'R$ #,##0.00';
    sheetResumo.getColumn(4).numFmt = 'R$ #,##0.00';

    // Destaque do saldo
    const rowSaldo = sheetResumo.lastRow;
    if (rowSaldo) {
      rowSaldo.font = { bold: true };
      rowSaldo.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: dados.resumo.saldo >= 0 ? "FFC8E6C9" : "FFFFCCBC",
        },
      };
    }

    sheetResumo.addRow([]);

    // Destaques
    if (dados.maiorGasto || dados.maiorReceita) {
      sheetResumo.addRow(["🔝 DESTAQUES DO MÊS"]).font = {
        size: 14,
        bold: true,
        color: { argb: "FF1A73E8" },
      };
      sheetResumo.addRow([]);

      const headerDestaques = sheetResumo.addRow([
        "Tipo",
        "Descrição",
        "Valor",
        "Categoria",
        "Data",
      ]);
      headerDestaques.font = { bold: true };
      headerDestaques.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE3F2FD" },
      };

      if (dados.maiorGasto) {
        sheetResumo.addRow([
          "🔻 Maior Gasto",
          dados.maiorGasto.descricao,
          dados.maiorGasto.valor,
          dados.maiorGasto.categoria,
          dados.maiorGasto.data,
        ]);
      }

      if (dados.maiorReceita) {
        sheetResumo.addRow([
          "🔺 Maior Receita",
          dados.maiorReceita.descricao,
          dados.maiorReceita.valor,
          dados.maiorReceita.categoria,
          dados.maiorReceita.data,
        ]);
      }

      sheetResumo.getColumn(3).numFmt = 'R$ #,##0.00';
      sheetResumo.getColumn(5).numFmt = 'dd/mm/yyyy';
    }

    // Ajusta largura das colunas
    sheetResumo.columns = [
      { width: 20 },
      { width: 30 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
    ];

    // ===== ABA 2: DESPESAS POR CATEGORIA =====
    const despesas = dados.categorias.filter((c) => c.tipo === "despesa");
    if (despesas.length > 0) {
      const sheetDespesas = workbook.addWorksheet("Despesas por Categoria", {
        properties: { tabColor: { argb: "FFF44336" } },
      });

      // Cabeçalho
      sheetDespesas.mergeCells("A1:E1");
      const cellTituloDespesas = sheetDespesas.getCell("A1");
      cellTituloDespesas.value = "📂 DESPESAS POR CATEGORIA";
      cellTituloDespesas.font = {
        size: 16,
        bold: true,
        color: { argb: "FFF44336" },
      };
      cellTituloDespesas.alignment = { horizontal: "center" };
      sheetDespesas.getRow(1).height = 25;

      sheetDespesas.addRow([]);

      // Headers
      const headerDespesas = sheetDespesas.addRow([
        "Categoria",
        "Total",
        "Quantidade",
        "Percentual",
        "Média por Transação",
      ]);
      headerDespesas.font = { bold: true };
      headerDespesas.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEBEE" },
      };
      headerDespesas.alignment = { horizontal: "center" };

      // Dados
      despesas.forEach((cat) => {
        sheetDespesas.addRow([
          cat.nome,
          cat.total,
          cat.quantidade,
          cat.percentual / 100,
          cat.total / cat.quantidade,
        ]);
      });

      // Formatação
      sheetDespesas.getColumn(2).numFmt = 'R$ #,##0.00';
      sheetDespesas.getColumn(4).numFmt = '0.00%';
      sheetDespesas.getColumn(5).numFmt = 'R$ #,##0.00';

      // Ajusta larguras
      sheetDespesas.columns = [
        { width: 25 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
      ];
    }

    // ===== ABA 3: RECEITAS POR CATEGORIA =====
    const receitas = dados.categorias.filter((c) => c.tipo === "receita");
    if (receitas.length > 0) {
      const sheetReceitas = workbook.addWorksheet("Receitas por Categoria", {
        properties: { tabColor: { argb: "FF4CAF50" } },
      });

      // Cabeçalho
      sheetReceitas.mergeCells("A1:E1");
      const cellTituloReceitas = sheetReceitas.getCell("A1");
      cellTituloReceitas.value = "📈 RECEITAS POR CATEGORIA";
      cellTituloReceitas.font = {
        size: 16,
        bold: true,
        color: { argb: "FF4CAF50" },
      };
      cellTituloReceitas.alignment = { horizontal: "center" };
      sheetReceitas.getRow(1).height = 25;

      sheetReceitas.addRow([]);

      // Headers
      const headerReceitas = sheetReceitas.addRow([
        "Categoria",
        "Total",
        "Quantidade",
        "Percentual",
        "Média por Transação",
      ]);
      headerReceitas.font = { bold: true };
      headerReceitas.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F5E9" },
      };
      headerReceitas.alignment = { horizontal: "center" };

      // Dados
      receitas.forEach((cat) => {
        sheetReceitas.addRow([
          cat.nome,
          cat.total,
          cat.quantidade,
          cat.percentual / 100,
          cat.total / cat.quantidade,
        ]);
      });

      // Formatação
      sheetReceitas.getColumn(2).numFmt = 'R$ #,##0.00';
      sheetReceitas.getColumn(4).numFmt = '0.00%';
      sheetReceitas.getColumn(5).numFmt = 'R$ #,##0.00';

      // Ajusta larguras
      sheetReceitas.columns = [
        { width: 25 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
      ];
    }

    // ===== ABA 4: TRANSAÇÕES POR DIA =====
    if (dados.transacoesPorDia.length > 0) {
      const sheetDiario = workbook.addWorksheet("Movimentação Diária", {
        properties: { tabColor: { argb: "FF9C27B0" } },
      });

      // Cabeçalho
      sheetDiario.mergeCells("A1:D1");
      const cellTituloDiario = sheetDiario.getCell("A1");
      cellTituloDiario.value = "📅 MOVIMENTAÇÃO DIÁRIA";
      cellTituloDiario.font = { size: 16, bold: true, color: { argb: "FF9C27B0" } };
      cellTituloDiario.alignment = { horizontal: "center" };
      sheetDiario.getRow(1).height = 25;

      sheetDiario.addRow([]);

      // Headers
      const headerDiario = sheetDiario.addRow([
        "Dia",
        "Receitas",
        "Despesas",
        "Saldo do Dia",
      ]);
      headerDiario.font = { bold: true };
      headerDiario.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3E5F5" },
      };
      headerDiario.alignment = { horizontal: "center" };

      // Dados
      dados.transacoesPorDia.forEach((dia) => {
        const saldoDia = dia.receitas - dia.despesas;
        sheetDiario.addRow([dia.dia, dia.receitas, dia.despesas, saldoDia]);
      });

      // Formatação
      sheetDiario.getColumn(2).numFmt = 'R$ #,##0.00';
      sheetDiario.getColumn(3).numFmt = 'R$ #,##0.00';
      sheetDiario.getColumn(4).numFmt = 'R$ #,##0.00';

      // Ajusta larguras
      sheetDiario.columns = [
        { width: 10 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
      ];
    }

    // Salva o arquivo
    await workbook.xlsx.writeFile(caminhoCompleto);

    return caminhoCompleto;
  }
}
