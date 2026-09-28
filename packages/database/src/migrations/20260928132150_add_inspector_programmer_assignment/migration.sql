BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InspectorProgrammerAssignment] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [InspectorProgrammerAssignment_id_df] DEFAULT newid(),
    [inspectorId] UNIQUEIDENTIFIER NOT NULL,
    [programmerId] NVARCHAR(1000) NOT NULL,
    [programmerName] NVARCHAR(1000) NOT NULL,
    [programmerEmail] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [InspectorProgrammerAssignment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [InspectorProgrammerAssignment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [InspectorProgrammerAssignment_inspectorId_key] UNIQUE NONCLUSTERED ([inspectorId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [InspectorProgrammerAssignment_programmerId_idx] ON [dbo].[InspectorProgrammerAssignment]([programmerId]);

-- AddForeignKey
ALTER TABLE [dbo].[InspectorProgrammerAssignment] ADD CONSTRAINT [InspectorProgrammerAssignment_inspectorId_fkey] FOREIGN KEY ([inspectorId]) REFERENCES [dbo].[Inspector]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
