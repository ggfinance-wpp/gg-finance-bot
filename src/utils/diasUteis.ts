export function ehFimDeSemana(data: Date): boolean {
  const dia = data.getDay();
  return dia === 0 || dia === 6;
}

export function ehDiaUtil(data: Date): boolean {
  return !ehFimDeSemana(data);
}

export function nEsimoDiaUtil(
  mes: number,
  ano: number,
  n: number
): Date {
  if (n <= 0) {
    throw new Error("n deve ser maior que zero");
  }

  const data = new Date(ano, mes - 1, 1);
  let contador = 0;

  while (true) {
    if (ehDiaUtil(data)) {
      contador++;
      if (contador === n) {
        return new Date(data);
      }
    }
    data.setDate(data.getDate() + 1);
  }
}
