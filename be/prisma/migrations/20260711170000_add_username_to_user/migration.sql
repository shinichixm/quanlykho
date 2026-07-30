-- Add username as nullable first, backfill, then enforce NOT NULL + UNIQUE
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL;

UPDATE `User` SET `username` = 'admin' WHERE `username` IS NULL;

ALTER TABLE `User` MODIFY `username` VARCHAR(191) NOT NULL;

ALTER TABLE `User` ADD UNIQUE INDEX `User_username_key`(`username`);

-- Email is no longer required for login
ALTER TABLE `User` MODIFY `email` VARCHAR(191) NULL;
