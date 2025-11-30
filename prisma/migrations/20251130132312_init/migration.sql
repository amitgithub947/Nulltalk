/*
  Warnings:

  - You are about to drop the column `category` on the `Confession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Confession" DROP COLUMN "category",
ADD COLUMN     "categoryId" INTEGER;

-- DropEnum
DROP TYPE "public"."Category";

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "Confession" ADD CONSTRAINT "Confession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
