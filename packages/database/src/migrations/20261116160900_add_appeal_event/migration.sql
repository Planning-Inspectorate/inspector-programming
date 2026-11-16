BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AppealEvent] (
    [eventId] NVARCHAR(1000) NOT NULL,
    [caseReference] NVARCHAR(1000) NOT NULL,
    [eventType] NVARCHAR(1000) NOT NULL,
    [eventStartDateTime] DATETIME2,
    [eventEndDateTime] DATETIME2,
    CONSTRAINT [AppealEvent_pkey] PRIMARY KEY CLUSTERED ([eventId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AppealEvent_caseReference_idx] ON [dbo].[AppealEvent]([caseReference]);

-- AddForeignKey
ALTER TABLE [dbo].[AppealEvent] ADD CONSTRAINT [AppealEvent_caseReference_fkey] FOREIGN KEY ([caseReference]) REFERENCES [dbo].[AppealCase]([caseReference]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
