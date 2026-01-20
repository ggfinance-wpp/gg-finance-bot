const PALAVRAS_PROIBIDAS = [
  "oi",
  "ola",
  "olá",
  "bom",
  "boa",
  "dia",
  "tarde",
  "noite",
  "tudo",
  "bem",
  "ok",
  "sim",
  "não",
  "nao"
];

export function validarNomeBasico(nome: string): boolean {
  const n = nome.trim();

  if (n.length < 5) return false;
  if (/\d/.test(n)) return false;
  if (!n.includes(" ")) return false; // exige nome + sobrenome
  if (/[^a-zA-ZÀ-ÿ\s]/.test(n)) return false; // evita emojis, símbolos

  return true;
}


export function contemTermoProibido(nome: string): boolean {
  const partes = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/);

  return partes.some(p => PALAVRAS_PROIBIDAS.includes(p));
}
