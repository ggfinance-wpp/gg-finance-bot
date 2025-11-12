interface EstadoConversa {
  telefone: string;
  etapa: "aguardando_nome" | "aguardando_cpf" | null;
  dadosParciais?: { nome?: string };
}

const conversas = new Map<string, EstadoConversa>();

export class ConversaRepository {
  static definirEtapa(telefone: string, etapa: EstadoConversa["etapa"], dadosParciais?: any) {
    conversas.set(telefone, { telefone, etapa, dadosParciais });
  }

  static obter(telefone: string): EstadoConversa | undefined {
    return conversas.get(telefone);
  }

  static limpar(telefone: string) {
    conversas.delete(telefone);
  }
}
