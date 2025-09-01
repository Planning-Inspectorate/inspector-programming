/*
  Warnings:

  - A unique constraint covering the columns `[caseId]` on the table `AppealCase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `caseId` to the `AppealCase` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AppealCase] ADD [caseId] INT NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[AppealCase] ADD CONSTRAINT [AppealCase_caseId_key] UNIQUE NONCLUSTERED ([caseId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
