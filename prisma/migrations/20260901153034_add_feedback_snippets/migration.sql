-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "feedback" TEXT;

-- CreateTable
CREATE TABLE "FeedbackSnippet" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "FeedbackSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackSnippet_teacherId_idx" ON "FeedbackSnippet"("teacherId");

-- AddForeignKey
ALTER TABLE "FeedbackSnippet" ADD CONSTRAINT "FeedbackSnippet_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
