/*
  Warnings:

  - You are about to drop the column `proficiency` on the `InspectorSpecialCircumstance` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `InspectorSpecialCircumstance` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[InspectorSpecialCircumstance] DROP COLUMN [proficiency],
[validFrom];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
