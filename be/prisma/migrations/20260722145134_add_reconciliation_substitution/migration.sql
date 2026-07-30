-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `reconciliationResolvedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ReconciliationSubstitution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `invoiceItemId` INTEGER NOT NULL,
    `substituteProductId` INTEGER NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReconciliationSubstitution_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReconciliationSubstitution` ADD CONSTRAINT `ReconciliationSubstitution_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReconciliationSubstitution` ADD CONSTRAINT `ReconciliationSubstitution_invoiceItemId_fkey` FOREIGN KEY (`invoiceItemId`) REFERENCES `InvoiceItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReconciliationSubstitution` ADD CONSTRAINT `ReconciliationSubstitution_substituteProductId_fkey` FOREIGN KEY (`substituteProductId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
