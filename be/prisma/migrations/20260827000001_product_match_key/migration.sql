-- AlterTable: thêm khóa so khớp đã chuẩn hóa cho sản phẩm
ALTER TABLE `Product`
    ADD COLUMN `nameKey` VARCHAR(1000) NOT NULL DEFAULT '',
    ADD COLUMN `unitKey` VARCHAR(255) NOT NULL DEFAULT '';

-- CreateIndex (prefix index: VarChar dài + utf8mb4 vượt giới hạn khóa index 3072 byte)
CREATE INDEX `Product_nameKey_unitKey_idx` ON `Product`(`nameKey`(191), `unitKey`(191));

-- Backfill sơ bộ (chỉ trim + hạ chữ thường). Chuẩn hóa đầy đủ + gộp sản phẩm
-- trùng do script `npm run fix:products` xử lý ngay sau khi deploy.
UPDATE `Product`
SET `nameKey` = LOWER(TRIM(`name`)),
    `unitKey` = LOWER(TRIM(`unit`));
