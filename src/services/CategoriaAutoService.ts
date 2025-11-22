// services/CategoriaAutoService.ts
import { CategoriaRepository } from "../repositories/categoria.repository";

export class CategoriaAutoService {

  static async resolver(usuarioId: string, nomeIA: string | null, tipo: "receita" | "despesa") {

    // Caso IA não retorne nada → usar categoria padrão
    if (!nomeIA) {
      const nomePadrao = tipo === "receita" ? "Outras receitas" : "Outras despesas";
      return this.pegarOuCriar(usuarioId, nomePadrao, tipo);
    }

    const nomeNormalizado = nomeIA.trim().toLowerCase();

    // Buscar categorias insensitivamente
    const categoriaExistente = await CategoriaRepository.buscarPorNome(usuarioId, nomeNormalizado);

    if (categoriaExistente) {
      return categoriaExistente.id;
    }

    // Criar nova categoria automaticamente
    const nova = await CategoriaRepository.criar({
      usuarioId,
      nome: nomeNormalizado,
      tipo
    });

    return nova.id;
  }

  private static async pegarOuCriar(usuarioId: string, nome: string, tipo: "receita" | "despesa") {
    const categoriaExistente = await CategoriaRepository.buscarPorNome(usuarioId, nome);

    if (categoriaExistente) {
      return categoriaExistente.id;
    }

    const nova = await CategoriaRepository.criar({
      usuarioId,
      nome,
      tipo
    });

    return nova.id;
  }
}
