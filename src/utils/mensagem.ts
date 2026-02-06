import { extrairDiaUtilPtBr } from "./parseDatabr";

export type Msg = {
  raw: string;
  trim: string;
  norm: string; // versão oficial pra regex/match
  regraDiaUtil: ReturnType<typeof extrairDiaUtilPtBr>;
};

export function normalizarParaMatch(texto: string) {
  return (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function preprocessarMensagem(mensagem: string): Msg {
  const trim = (mensagem ?? "").trim();
  return {
    raw: mensagem ?? "",
    trim,
    norm: normalizarParaMatch(trim),
    regraDiaUtil: extrairDiaUtilPtBr(mensagem),
  };
}
