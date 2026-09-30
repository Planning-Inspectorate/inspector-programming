BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Inspector] ADD [programmerAssignedAt] DATETIME2,
[programmerId] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Inspector_programmerId_idx] ON [dbo].[Inspector]([programmerId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
