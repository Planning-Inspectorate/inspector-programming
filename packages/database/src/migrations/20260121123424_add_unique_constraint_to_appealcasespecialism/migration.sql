/*
  Warnings:

  - A unique constraint covering the columns `[caseReference,specialism]` on the table `AppealCaseSpecialism` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[AppealCaseSpecialism] ADD CONSTRAINT [AppealCaseSpecialism_caseReference_specialism_key] UNIQUE NONCLUSTERED ([caseReference], [specialism]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
