import { prisma } from "../infra/prisma";

export interface DadosRelatorioMensal {
  usuario: {
    nome: string;
    telefone: string;
  };
  periodo: {
    mes: number;
    ano: number;
    mesNome: string;
  };
  resumo: {
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    quantidadeReceitas: number;
    quantidadeDespesas: number;
  };
  categorias: {
    nome: string;
    tipo: "receita" | "despesa";
    total: number;
    quantidade: number;
    percentual: number;
  }[];
  maiorGasto: {
    descricao: string;
    valor: number;
    data: Date;
    categoria: string;
  } | null;
  maiorReceita: {
    descricao: string;
    valor: number;
    data: Date;
    categoria: string;
  } | null;
  transacoesPorDia: {
    dia: number;
    receitas: number;
    despesas: number;
  }[];
}

export class RelatorioMensalRepository {
  /**
   * Busca dados completos para o relatório mensal de um usuário
   */
  static async buscarDadosRelatorio(
    usuarioId: string,
    mes: number,
    ano: number
  ): Promise<DadosRelatorioMensal | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true, telefone: true },
    });

    if (!usuario) return null;

    // Calcula intervalo de datas do mês
    const dataInicio = new Date(ano, mes - 1, 1); // primeiro dia do mês
    const dataFim = new Date(ano, mes, 0, 23, 59, 59); // último dia do mês

    // Busca todas as transações do mês
    const transacoes = await prisma.transacao.findMany({
      where: {
        usuarioId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: "concluida", // apenas transações concluídas
      },
      include: {
        categoria: true,
      },
      orderBy: {
        data: "asc",
      },
    });

    // Calcula totais
    const receitas = transacoes.filter((t: any) => t.tipo === "receita");
    const despesas = transacoes.filter((t: any) => t.tipo === "despesa");

    const totalReceitas = receitas.reduce(
      (sum: number, t) => sum + Number(t.valor),
      0
    );
    const totalDespesas = despesas.reduce(
      (sum: number, t) => sum + Number(t.valor),
      0
    );

    // Agrupa por categoria
    const categoriaMap = new Map<
      string,
      {
        nome: string;
        tipo: "receita" | "despesa";
        total: number;
        quantidade: number;
      }
    >();

    transacoes.forEach((t: any) => {
      const categoriaNome = t.categoria?.nome || "Sem categoria";
      const key = `${t.tipo}-${categoriaNome}`;

      if (!categoriaMap.has(key)) {
        categoriaMap.set(key, {
          nome: categoriaNome,
          tipo: t.tipo as "receita" | "despesa",
          total: 0,
          quantidade: 0,
        });
      }

      const cat = categoriaMap.get(key)!;
      cat.total += Number(t.valor);
      cat.quantidade += 1;
    });

    // Calcula percentuais e ordena
    const categorias = Array.from(categoriaMap.values())
      .map((cat) => {
        const base = cat.tipo === "receita" ? totalReceitas : totalDespesas;
        return {
          ...cat,
          percentual: base > 0 ? (cat.total / base) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Encontra maior gasto e maior receita
    const maiorGasto =
      despesas.length > 0
        ? despesas.reduce((max: any, t: any) =>
            Number(t.valor) > Number(max.valor) ? t : max
          )
        : null;

    const maiorReceita =
      receitas.length > 0
        ? receitas.reduce((max: any, t: any) =>
            Number(t.valor) > Number(max.valor) ? t : max
          )
        : null;

    // Agrupa transações por dia
    const diasMap = new Map<number, { receitas: number; despesas: number }>();

    transacoes.forEach((t: any) => {
      const dia = t.data.getDate();
      if (!diasMap.has(dia)) {
        diasMap.set(dia, { receitas: 0, despesas: 0 });
      }

      const diaData = diasMap.get(dia)!;
      if (t.tipo === "receita") {
        diaData.receitas += Number(t.valor);
      } else {
        diaData.despesas += Number(t.valor);
      }
    });

    const transacoesPorDia = Array.from(diasMap.entries())
      .map(([dia, data]) => ({
        dia,
        receitas: data.receitas,
        despesas: data.despesas,
      }))
      .sort((a, b) => a.dia - b.dia);

    // Nome do mês em português
    const mesesNomes = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    return {
      usuario: {
        nome: usuario.nome || "Usuário",
        telefone: usuario.telefone,
      },
      periodo: {
        mes,
        ano,
        mesNome: mesesNomes[mes - 1],
      },
      resumo: {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        quantidadeReceitas: receitas.length,
        quantidadeDespesas: despesas.length,
      },
      categorias,
      maiorGasto: maiorGasto
        ? {
            descricao: maiorGasto.descricao || "Sem descrição",
            valor: Number(maiorGasto.valor),
            data: maiorGasto.data,
            categoria: maiorGasto.categoria?.nome || "Sem categoria",
          }
        : null,
      maiorReceita: maiorReceita
        ? {
            descricao: maiorReceita.descricao || "Sem descrição",
            valor: Number(maiorReceita.valor),
            data: maiorReceita.data,
            categoria: maiorReceita.categoria?.nome || "Sem categoria",
          }
        : null,
      transacoesPorDia,
    };
  }

  /**
   * Busca todos os usuários que têm transações no mês especificado
   */
  static async buscarUsuariosComTransacoes(
    mes: number,
    ano: number
  ): Promise<string[]> {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    const usuarios = await prisma.transacao.findMany({
      where: {
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: "concluida",
      },
      select: {
        usuarioId: true,
      },
      distinct: ["usuarioId"],
    });

    return usuarios.map((u: any) => u.usuarioId);
  }
}
