BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AppealCase] ADD [appellantCostsAppliedFor] BIT,
[inspectorId] NVARCHAR(1000),
[lpaCostsAppliedFor] BIT,
[originalDevelopmentDescription] NVARCHAR(1000),
[siteAddressLatitude] DECIMAL(9,6),
[siteAddressLongitude] DECIMAL(9,6);

-- CreateTable
CREATE TABLE [dbo].[AppealCaseSpecialism] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [AppealCaseSpecialism_id_df] DEFAULT newid(),
    [caseReference] NVARCHAR(1000) NOT NULL,
    [specialism] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [AppealCaseSpecialism_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AppealEvent] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseReference] NVARCHAR(1000) NOT NULL,
    [eventType] NVARCHAR(1000) NOT NULL,
    [eventName] NVARCHAR(1000),
    [eventStatus] NVARCHAR(1000) NOT NULL,
    [eventStartDateTime] DATETIME2 NOT NULL,
    [eventEndDateTime] DATETIME2,
    [addressLine1] NVARCHAR(1000),
    [addressLine2] NVARCHAR(1000),
    [addressTown] NVARCHAR(1000),
    [addressCounty] NVARCHAR(1000),
    [addressPostcode] NVARCHAR(1000),
    CONSTRAINT [AppealEvent_id_key] UNIQUE NONCLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[AppealCaseSpecialism] ADD CONSTRAINT [AppealCaseSpecialism_caseReference_fkey] FOREIGN KEY ([caseReference]) REFERENCES [dbo].[AppealCase]([caseReference]) ON DELETE CASCADE ON UPDATE CASCADE;

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
