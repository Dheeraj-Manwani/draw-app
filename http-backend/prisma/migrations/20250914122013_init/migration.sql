/*
  Warnings:

  - The values [CIRCLE,EMBEDED] on the enum `ElementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `path` on the `Element` table. All the data in the column will be lost.
  - Added the required column `data` to the `Element` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Element` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElementType_new" AS ENUM ('RECTANGLE', 'ELLIPSE', 'FREE', 'LINE', 'ARROW', 'TEXT', 'EMBEDDED', 'PICTURE');
ALTER TABLE "Element" ALTER COLUMN "type" TYPE "ElementType_new" USING ("type"::text::"ElementType_new");
ALTER TYPE "ElementType" RENAME TO "ElementType_old";
ALTER TYPE "ElementType_new" RENAME TO "ElementType";
DROP TYPE "ElementType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Element" DROP COLUMN "path",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "_UserRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserRooms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserRooms_B_index" ON "_UserRooms"("B");

-- AddForeignKey
ALTER TABLE "_UserRooms" ADD CONSTRAINT "_UserRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRooms" ADD CONSTRAINT "_UserRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
