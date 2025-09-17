/*
  Warnings:

  - You are about to drop the column `lpaRegion` on the `AppealCase` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AppealCase] DROP COLUMN [lpaRegion];

-- CreateTable
CREATE TABLE [dbo].[Lpa] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [lpaCode] NVARCHAR(1000) NOT NULL,
    [lpaName] NVARCHAR(1000),
    [lpaRegionId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [Lpa_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Lpa_lpaCode_key] UNIQUE NONCLUSTERED ([lpaCode])
);

-- CreateTable
CREATE TABLE [dbo].[LpaRegion] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [LpaRegion_id_df] DEFAULT newid(),
    [number] INT NOT NULL,
    [lpaRegionNameId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [LpaRegion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LpaRegion_lpaRegionNameId_number_key] UNIQUE NONCLUSTERED ([lpaRegionNameId],[number])
);

-- CreateTable
CREATE TABLE [dbo].[LpaRegionName] (
    [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [LpaRegionName_id_df] DEFAULT newid(),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [LpaRegionName_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LpaRegionName_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Lpa_lpaRegionId_idx] ON [dbo].[Lpa]([lpaRegionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LpaRegion_lpaRegionNameId_idx] ON [dbo].[LpaRegion]([lpaRegionNameId]);

-- AddForeignKey
ALTER TABLE [dbo].[AppealCase] ADD CONSTRAINT [AppealCase_lpaCode_fkey] FOREIGN KEY ([lpaCode]) REFERENCES [dbo].[Lpa]([lpaCode]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Lpa] ADD CONSTRAINT [Lpa_lpaRegionId_fkey] FOREIGN KEY ([lpaRegionId]) REFERENCES [dbo].[LpaRegion]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LpaRegion] ADD CONSTRAINT [LpaRegion_lpaRegionNameId_fkey] FOREIGN KEY ([lpaRegionNameId]) REFERENCES [dbo].[LpaRegionName]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
