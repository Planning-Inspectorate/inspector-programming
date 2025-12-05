BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InspectorSpecialCircumstance] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [InspectorSpecialCircumstance_id_df] DEFAULT newid(),
    [inspectorId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [proficiency] NVARCHAR(1000),
    [validFrom] DATETIME2,
    CONSTRAINT [InspectorSpecialCircumstance_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [InspectorSpecialCircumstance_inspectorId_name_key] UNIQUE NONCLUSTERED ([inspectorId],[name])
);

-- AddForeignKey
ALTER TABLE [dbo].[InspectorSpecialCircumstance] ADD CONSTRAINT [InspectorSpecialCircumstance_inspectorId_fkey] FOREIGN KEY ([inspectorId]) REFERENCES [dbo].[Inspector]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
