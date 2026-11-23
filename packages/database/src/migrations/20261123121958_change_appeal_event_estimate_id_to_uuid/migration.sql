/*
  Warnings:

  - The `id` column on the `AppealEventEstimate` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AppealEventEstimate] DROP CONSTRAINT [AppealEventEstimate_pkey];
ALTER TABLE [dbo].[AppealEventEstimate] DROP COLUMN [id];
ALTER TABLE [dbo].[AppealEventEstimate] ADD [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [AppealEventEstimate_id_df] DEFAULT newid();
ALTER TABLE [dbo].[AppealEventEstimate] ADD CONSTRAINT AppealEventEstimate_pkey PRIMARY KEY CLUSTERED ([id]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
