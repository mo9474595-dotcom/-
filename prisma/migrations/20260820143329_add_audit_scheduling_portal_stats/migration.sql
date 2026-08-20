-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "closesAt" TIMESTAMP(3),
ADD COLUMN     "opensAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "portalAccessCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "portalLastAccessAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,
    "classSectionId" TEXT,
    "examId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_teacherId_createdAt_idx" ON "AuditLog"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_classSectionId_idx" ON "AuditLog"("classSectionId");

-- CreateIndex
CREATE INDEX "AuditLog_examId_idx" ON "AuditLog"("examId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
