/*
  Warnings:

  - You are about to drop the `AppealEvent` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[AppealEvent] DROP CONSTRAINT [AppealEvent_caseReference_fkey];

-- DropTable
DROP TABLE [dbo].[AppealEvent];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
