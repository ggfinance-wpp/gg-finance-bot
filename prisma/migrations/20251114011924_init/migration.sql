-- CreateTable
CREATE TABLE `Contexto` (
    `telefone` VARCHAR(191) NOT NULL,
    `etapa` VARCHAR(191) NOT NULL,
    `dados` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`telefone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
