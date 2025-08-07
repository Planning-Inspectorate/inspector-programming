/*
  Warnings:

  - The primary key for the `Inspector` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `chartingOfficer` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `chartingOfficerPhone` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `fte` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `inspectorManager` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `mobilePhone` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `proficiency` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `resourceGroup` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `specialisms` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `Inspector` table. All the data in the column will be lost.
  - You are about to drop the column `workPhone` on the `Inspector` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Inspector` table. The data in that column will be cast from `Int` to `String`. This cast may fail. Please make sure the data in the column can be cast.
  - Added the required column `firstName` to the `Inspector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Inspector` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[InspectorSpecialism] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [InspectorSpecialism_id_df] DEFAULT newid(),
    [inspectorId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [proficiency] NVARCHAR(1000),
    [validFrom] DATETIME2,
    CONSTRAINT [InspectorSpecialism_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- RedefineTables
BEGIN TRANSACTION;
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'Inspector'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_Inspector] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Inspector_id_df] DEFAULT newid(),
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [postcode] NVARCHAR(1000),
    [grade] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [entraId] NVARCHAR(1000),
    [workingAboveBand] BIT,
    CONSTRAINT [Inspector_pkey] PRIMARY KEY CLUSTERED ([id])
);
IF EXISTS(SELECT * FROM [dbo].[Inspector])
    EXEC('INSERT INTO [dbo].[_prisma_new_Inspector] ([grade],[id]) SELECT [grade],[id] FROM [dbo].[Inspector] WITH (holdlock tablockx)');
DROP TABLE [dbo].[Inspector];
EXEC SP_RENAME N'dbo._prisma_new_Inspector', N'Inspector';
COMMIT;

-- AddForeignKey
ALTER TABLE [dbo].[InspectorSpecialism] ADD CONSTRAINT [InspectorSpecialism_inspectorId_fkey] FOREIGN KEY ([inspectorId]) REFERENCES [dbo].[Inspector]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
