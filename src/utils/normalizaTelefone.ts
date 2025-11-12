export function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, ""); // mantém só números
}
