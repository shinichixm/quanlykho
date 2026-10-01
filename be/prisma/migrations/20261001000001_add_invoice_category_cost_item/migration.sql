-- AlterTable
ALTER TABLE `Invoice`
    ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'goods';

-- CreateTable
CREATE TABLE `CostItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `name` VARCHAR(1000) NOT NULL,
    `unit` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(18, 3) NOT NULL,
    `unitPrice` DECIMAL(18, 2) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,

    INDEX `CostItem_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CostItem` ADD CONSTRAINT `CostItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
