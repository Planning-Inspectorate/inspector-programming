BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Inspector] (
    [id] INT NOT NULL IDENTITY(1,1),
    [address] NVARCHAR(1000) NOT NULL,
    [workPhone] NVARCHAR(1000) NOT NULL,
    [mobilePhone] NVARCHAR(1000) NOT NULL,
    [resourceGroup] NVARCHAR(1000) NOT NULL,
    [grade] NVARCHAR(1000) NOT NULL,
    [fte] NVARCHAR(1000) NOT NULL,
    [chartingOfficer] NVARCHAR(1000) NOT NULL,
    [chartingOfficerPhone] NVARCHAR(1000) NOT NULL,
    [inspectorManager] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [proficiency] NVARCHAR(1000) NOT NULL,
    [validFrom] NVARCHAR(1000) NOT NULL,
    [specialisms] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Inspector_pkey] PRIMARY KEY CLUSTERED ([id])
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
