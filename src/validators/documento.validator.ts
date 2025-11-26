export function validarCpfCnpj(documento: string): boolean {
    const digitos = documento.replace(/\D/g, '');

    if (digitos.length === 11) {
        return validarCpf(digitos);
    } else if (digitos.length === 14) {
        return validarCnpj(digitos);
    }
    return false;
}

export function validarCpf(cpf: string): boolean {

    if (/^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let primeiroDigito = 11 - (soma % 11);
    if (primeiroDigito >= 10) primeiroDigito = 0;

    if (primeiroDigito !== parseInt(cpf.charAt(9))) return false;

    // Cálculo do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let segundoDigito = 11 - (soma % 11);
    if (segundoDigito >= 10) segundoDigito = 0;

    if (segundoDigito !== parseInt(cpf.charAt(10))) return false;

    return true;
}

export function validarCnpj(cnpj: string): boolean {

    // Bloquear sequências tipo 00000000000000
    if (/^(\d)\1+$/.test(cnpj)) return false;

    const calcularDigito = (base: string, pesos: number[]) => {
        let soma = 0;
        for (let i = 0; i < pesos.length; i++) {
            soma += parseInt(base.charAt(i)) * pesos[i];
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const base12 = cnpj.substr(0, 12);
    const digito1 = calcularDigito(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    const base13 = base12 + digito1;
    const digito2 = calcularDigito(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    const dvInformado = cnpj.substr(12, 2);

    return dvInformado === `${digito1}${digito2}`;
}