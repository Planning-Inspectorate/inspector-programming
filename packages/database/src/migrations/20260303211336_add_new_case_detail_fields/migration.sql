BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AppealCase] ADD [applicationDecision] NVARCHAR(1000),
[designatedSitesNames] NVARCHAR(1000),
[isAonbNationalLandscape] BIT,
[isGreenBelt] BIT,
[typeOfPlanningApplication] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
