BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AppealCase] (
    [caseReference] NVARCHAR(1000) NOT NULL,
    [caseStatus] NVARCHAR(1000),
    [caseType] NVARCHAR(1000),
    [caseProcedure] NVARCHAR(1000),
    [allocationLevel] NVARCHAR(1000),
    [allocationBand] INT,
    [siteAddressLine1] NVARCHAR(1000),
    [siteAddressLine2] NVARCHAR(1000),
    [siteAddressTown] NVARCHAR(1000),
    [siteAddressCounty] NVARCHAR(1000),
    [siteAddressPostcode] NVARCHAR(1000),
    [lpaCode] NVARCHAR(1000),
    [lpaName] NVARCHAR(1000),
    [lpaRegion] NVARCHAR(1000),
    [caseValidDate] DATETIME2,
    [finalCommentsDueDate] DATETIME2,
    [linkedCaseStatus] NVARCHAR(1000),
    [leadCaseReference] NVARCHAR(1000),
    CONSTRAINT [AppealCase_pkey] PRIMARY KEY CLUSTERED ([caseReference])
);

-- CreateTable
CREATE TABLE [dbo].[AppealCasePollStatus] (
    [id] INT NOT NULL IDENTITY(1,1),
    [lastPollAt] DATETIME2 NOT NULL,
    [casesFetched] INT NOT NULL,
    CONSTRAINT [AppealCasePollStatus_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
