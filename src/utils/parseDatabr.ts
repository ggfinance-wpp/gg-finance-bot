export function parseDataPtBr(texto: string): Date | null {
    if (!texto) return null;

    // normaliza: minúsculo + remove espaços extras
    let t = texto.toLowerCase().trim();

    // remove pontuação que atrapalha (vírgula, ponto, etc.)
    // mantém / e - porque são úteis em datas
    t = t.replace(/[.,;:!?]/g, " ").replace(/\s+/g, " ").trim();

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    // ✅ "amanhã" em qualquer lugar da frase (não só string exata)
    if (/\bamanh[aã]\b/.test(t)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);

        // se também tiver uma data explícita na frase, prioriza a data explícita
        // ex: "amanhã, dia 21/01/26"
        const dataExplicita = extrairDataNumericaDeTexto(t, anoAtual, hoje);
        if (dataExplicita) return dataExplicita;

        return d;
    }

    // ✅ tenta extrair data numérica mesmo quando está no meio do texto
    const dataNum = extrairDataNumericaDeTexto(t, anoAtual, hoje);
    if (dataNum) return dataNum;

    // "dia 1", "no dia 5" (agora tolerante dentro do texto)
    const diaSimples = extrairDiaSimplesFlex(t);
    if (diaSimples !== null && !t.includes("mês que vem") && !t.includes("mes que vem")) {
        const data = new Date(anoAtual, mesAtual, diaSimples);
        if (data < hoje) data.setMonth(data.getMonth() + 1);
        return data;
    }

    // “dia 5 do mês que vem”, “5 mês que vem”
    const mProxMes = t.match(/(?:dia\s+)?(\d{1,2}).*(m[eê]s que vem|pr[oó]ximo m[eê]s)/);
    if (mProxMes) {
        const dia = Number(mProxMes[1]);
        return new Date(anoAtual, mesAtual + 1, dia);
    }

    // “próximo mês dia 5”
    const mProxMes2 = t.match(/(pr[oó]ximo m[eê]s|m[eê]s que vem).*(?:dia\s+)?(\d{1,2})/);
    if (mProxMes2) {
        const dia = Number(mProxMes2[2]);
        return new Date(anoAtual, mesAtual + 1, dia);
    }

    // “dia 30 desse mês”, “30 do mês atual”
    const mMesAtual = t.match(/(?:dia\s+)?(\d{1,2}).*(desse m[eê]s|do m[eê]s atual|m[eê]s atual)/);
    if (mMesAtual) {
        const dia = Number(mMesAtual[1]);
        return new Date(anoAtual, mesAtual, dia);
    }

    // dia + mês por extenso (ex: "5 de março")
    const mesesMap: Record<string, number> = {
        janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
        julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
    };

    const m3 = t.match(/(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{4}))?/);
    if (m3) {
        const dia = Number(m3[1]);
        const mesNome = m3[2];
        const ano = m3[3] ? Number(m3[3]) : anoAtual;
        const mes = mesesMap[mesNome];
        if (mes === undefined) return null;

        let data = new Date(ano, mes, dia);
        if (!m3[3] && data < hoje) data.setFullYear(ano + 1);
        return data;
    }

    return null;
}

function extrairDataNumericaDeTexto(t: string, anoAtual: number, hoje: Date): Date | null {
    // ✅ 1) dd/mm/aa ou dd/mm/aaaa (prioridade)
    const m2 = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})/);
    if (m2) {
        const dia = Number(m2[1]);
        const mes = Number(m2[2]) - 1;
        let ano = Number(m2[3]);

        if (ano < 100) ano = 2000 + ano;

        return new Date(ano, mes, dia);
    }

    // ✅ 2) dd/mm ou dd-mm (sem ano)
    const m1 = t.match(/(\d{1,2})[\/\-](\d{1,2})(?![\/\-]\d)/);
    if (m1) {
        const dia = Number(m1[1]);
        const mes = Number(m1[2]) - 1;
        let ano = anoAtual;

        let data = new Date(ano, mes, dia);
        if (data < hoje) ano++;
        data = new Date(ano, mes, dia);

        return data;
    }

    return null;
}


/**
 * Versão flexível do extrairDiaSimples:
 * pega "dia 21" mesmo dentro de frase
 */
function extrairDiaSimplesFlex(t: string): number | null {
    // tenta "dia 21" no meio do texto
    const m1 = t.match(/\bdia\s+(\d{1,2})\b/);
    if (m1) {
        const dia = Number(m1[1]);
        if (!isNaN(dia) && dia >= 1 && dia <= 31) return dia;
    }

    // tenta só número inteiro como texto limpo (caso ainda seja só "21")
    const m2 = t.match(/^(?:no dia\s+|dia\s+)?(\d{1,2})$/);
    if (m2) {
        const dia = Number(m2[1]);
        if (!isNaN(dia) && dia >= 1 && dia <= 31) return dia;
    }

    return null;
}


/**
 * Extrai um dia se o texto for algo como:
 *  - "dia 1"
 *  - "1"
 *  - "no dia 5"
 * e NÃO contém mês explícito nem "/".
 */
export function extrairDiaSimples(texto: string): number | null {
    texto = texto.toLowerCase().trim();

    // Se tiver mês por extenso ou "/", já não é "só dia"
    if (
        texto.includes("janeiro") || texto.includes("fevereiro") || texto.includes("março") ||
        texto.includes("marco") || texto.includes("abril") || texto.includes("maio") ||
        texto.includes("junho") || texto.includes("julho") || texto.includes("agosto") ||
        texto.includes("setembro") || texto.includes("outubro") || texto.includes("novembro") ||
        texto.includes("dezembro") || texto.includes("/")
    ) {
        return null;
    }

    const m = texto.match(/^(?:no dia\s+|dia\s+)?(\d{1,2})$/);
    if (!m) return null;

    const dia = Number(m[1]);
    if (isNaN(dia) || dia < 1 || dia > 31) return null;

    return dia;
}

/**
 * Normaliza um mês vindo como:
 *  - "12", "01"
 *  - "dezembro", "dez"
 * Retorna índice 0–11 ou null.
 */
export function normalizarMes(texto: string): number | null {
    if (!texto) return null;
    texto = texto.toLowerCase().trim();

    // número direto
    const num = Number(texto.replace(/[^\d]/g, ""));
    if (!isNaN(num) && num >= 1 && num <= 12) {
        return num - 1;
    }

    const map: Record<string, number> = {
        "jan": 0, "janeiro": 0,
        "fev": 1, "fevereiro": 1,
        "mar": 2, "março": 2, "marco": 2,
        "abr": 3, "abril": 3,
        "mai": 4, "maio": 4,
        "jun": 5, "junho": 5,
        "jul": 6, "julho": 6,
        "ago": 7, "agosto": 7,
        "set": 8, "setembro": 8,
        "out": 9, "outubro": 9,
        "nov": 10, "novembro": 10,
        "dez": 11, "dezembro": 11
    };

    if (map[texto] !== undefined) return map[texto];

    return null;
}