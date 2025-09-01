BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[CalendarEventTiming] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [CalendarEventTiming_id_df] DEFAULT newid(),
    [prepTime] INT NOT NULL,
    [siteVisitTime] INT NOT NULL,
    [reportTime] INT NOT NULL,
    [costsTime] INT NOT NULL,
    CONSTRAINT [CalendarEventTiming_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CalendarEventTimingRule] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [CalendarEventTimingRule_id_df] DEFAULT newid(),
    [calendarEventTimingId] UNIQUEIDENTIFIER NOT NULL,
    [caseType] NVARCHAR(1000) NOT NULL,
    [caseProcedure] NVARCHAR(1000) NOT NULL,
    [allocationLevel] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CalendarEventTimingRule_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CalendarEventTimingRule_caseType_caseProcedure_allocationLevel_key] UNIQUE NONCLUSTERED ([caseType],[caseProcedure],[allocationLevel])
);

-- AddForeignKey
ALTER TABLE [dbo].[CalendarEventTimingRule] ADD CONSTRAINT [CalendarEventTimingRule_calendarEventTimingId_fkey] FOREIGN KEY ([calendarEventTimingId]) REFERENCES [dbo].[CalendarEventTiming]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
