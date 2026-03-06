/**
 * Script de teste para relatório mensal
 * 
 * USO:
 * npx tsx src/scripts/testeRelatorioMensal.ts <usuarioId> [mes] [ano]
 * 
 * Exemplos:
 * npx tsx src/scripts/testeRelatorioMensal.ts abc123@c.us
 * npx tsx src/scripts/testeRelatorioMensal.ts abc123@c.us 1 2026
 */

import { RelatorioMensalRepository } from "../repositories/relatorioMensal.repository";
import { RelatorioMensalPDFService } from "../services/geradores/RelatorioMensalPDF.service";
import { RelatorioMensalExcelService } from "../services/geradores/RelatorioMensalExcel.service";
import { connectDatabase } from "../infra/prisma";
import { logger } from "../utils/logger";
import { UsuarioRepository } from "../repositories/usuario.repository";

async function testarRelatorioMensal() {
  try {
    // Conecta ao banco
    await connectDatabase();

    // Pega argumentos da linha de comando
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log("\n❌ Uso: npx tsx src/scripts/testeRelatorioMensal.ts <userId> [mes] [ano]\n");
      console.log("Exemplos:");
      console.log("  npx tsx src/scripts/testeRelatorioMensal.ts 5511999999999@c.us");
      console.log("  npx tsx src/scripts/testeRelatorioMensal.ts 5511999999999@c.us 1 2026\n");
      process.exit(1);
    }

    const userId = args[0];
    
    // Busca usuário
    const usuario = await UsuarioRepository.buscarPorUserId(userId);
    
    if (!usuario) {
      console.log(`\n❌ Usuário com userId ${userId} não encontrado!\n`);
      process.exit(1);
    }

    console.log(`\n✅ Usuário encontrado: ${usuario.nome} (${usuario.telefone})\n`);

    // Define período (usa mês anterior se não especificado)
    let mes: number;
    let ano: number;

    if (args[1] && args[2]) {
      mes = parseInt(args[1]);
      ano = parseInt(args[2]);
    } else {
      const agora = new Date();
      const mesAnterior = agora.getMonth(); // já está no mês anterior (0-11)
      mes = mesAnterior === 0 ? 12 : mesAnterior;
      ano = mesAnterior === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
    }

    console.log(`📅 Gerando relatório para: ${mes}/${ano}\n`);

    // Busca dados do relatório
    console.log("🔍 Buscando dados do relatório...");
    const dados = await RelatorioMensalRepository.buscarDadosRelatorio(
      usuario.id,
      mes,
      ano
    );

    if (!dados) {
      console.log("\n❌ Erro ao buscar dados do relatório!\n");
      process.exit(1);
    }

    // Exibe resumo dos dados
    console.log("\n📊 RESUMO DOS DADOS:");
    console.log(`   Receitas: R$ ${dados.resumo.totalReceitas.toFixed(2)} (${dados.resumo.quantidadeReceitas} transações)`);
    console.log(`   Despesas: R$ ${dados.resumo.totalDespesas.toFixed(2)} (${dados.resumo.quantidadeDespesas} transações)`);
    console.log(`   Saldo: R$ ${dados.resumo.saldo.toFixed(2)}`);
    console.log(`   Categorias: ${dados.categorias.length}`);
    
    if (dados.maiorGasto) {
      console.log(`   Maior Gasto: ${dados.maiorGasto.descricao} - R$ ${dados.maiorGasto.valor.toFixed(2)}`);
    }
    
    if (dados.maiorReceita) {
      console.log(`   Maior Receita: ${dados.maiorReceita.descricao} - R$ ${dados.maiorReceita.valor.toFixed(2)}`);
    }

    if (dados.resumo.quantidadeReceitas === 0 && dados.resumo.quantidadeDespesas === 0) {
      console.log("\n⚠️ Não há transações neste período!\n");
      process.exit(0);
    }

    // Gera PDF
    console.log("\n📄 Gerando PDF...");
    const caminhoPDF = await RelatorioMensalPDFService.gerar(dados);
    console.log(`✅ PDF gerado: ${caminhoPDF}`);

    // Gera Excel
    console.log("\n📊 Gerando Excel...");
    const caminhoExcel = await RelatorioMensalExcelService.gerar(dados);
    console.log(`✅ Excel gerado: ${caminhoExcel}`);

    console.log("\n🎉 Relatórios gerados com sucesso!\n");
    console.log("📂 Confira os arquivos na pasta 'relatorios/'\n");

  } catch (error) {
    console.error("\n❌ Erro ao gerar relatório:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testarRelatorioMensal();
