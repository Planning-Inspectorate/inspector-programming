/*
  Warnings:

  - A unique constraint covering the columns `[inspectorId,name]` on the table `InspectorSpecialism` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[InspectorSpecialism] ADD CONSTRAINT [InspectorSpecialism_inspectorId_name_key] UNIQUE NONCLUSTERED ([inspectorId], [name]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
