BEGIN TRY

BEGIN TRAN;

-- CreateIndex
CREATE NONCLUSTERED INDEX [AppealCase_caseType_caseProcedure_allocationLevel_idx] ON [dbo].[AppealCase]([caseType], [caseProcedure], [allocationLevel]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
