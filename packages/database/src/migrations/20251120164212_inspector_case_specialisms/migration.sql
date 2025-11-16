BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InspectorCaseSpecialism] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [InspectorCaseSpecialism_id_df] DEFAULT newid(),
    [inspectorSpecialism] NVARCHAR(1000) NOT NULL,
    [inspectorSpecialismNormalized] NVARCHAR(1000) NOT NULL,
    [caseSpecialism] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InspectorCaseSpecialism_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [InspectorCaseSpecialism_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [InspectorCaseSpecialism_inspectorSpecialismNormalized_key] UNIQUE NONCLUSTERED ([inspectorSpecialismNormalized])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InspectorCaseSpecialism_caseSpecialism_idx] ON [dbo].[InspectorCaseSpecialism]([caseSpecialism]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
