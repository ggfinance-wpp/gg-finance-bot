-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `dataAgendada` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('pendente', 'concluida', 'cancelada') NOT NULL DEFAULT 'pendente';

-- CreateTable
CREATE TABLE `Lembrete` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `mensagem` VARCHAR(191) NOT NULL,
    `dataAlvo` DATETIME(3) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `enviado` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lembrete` ADD CONSTRAINT `Lembrete_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
