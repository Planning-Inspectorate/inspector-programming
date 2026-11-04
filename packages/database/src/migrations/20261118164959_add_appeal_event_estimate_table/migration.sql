BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AppealEventEstimate] (
    [id] INT NOT NULL,
    [caseReference] NVARCHAR(1000) NOT NULL,
    [preparationTime] DECIMAL(6,2),
    [sittingTime] DECIMAL(6,2),
    [reportingTime] DECIMAL(6,2),
    CONSTRAINT [AppealEventEstimate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AppealEventEstimate_caseReference_key] UNIQUE NONCLUSTERED ([caseReference])
);

-- AddForeignKey
ALTER TABLE [dbo].[AppealEventEstimate] ADD CONSTRAINT [AppealEventEstimate_caseReference_fkey] FOREIGN KEY ([caseReference]) REFERENCES [dbo].[AppealCase]([caseReference]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
