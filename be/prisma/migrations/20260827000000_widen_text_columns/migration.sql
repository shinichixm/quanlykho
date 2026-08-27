-- AlterTable
ALTER TABLE `Product`
    MODIFY `name` VARCHAR(1000) NOT NULL,
    MODIFY `unit` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `Partner`
    MODIFY `name` VARCHAR(500) NOT NULL,
    MODIFY `address` VARCHAR(1000) NULL;
