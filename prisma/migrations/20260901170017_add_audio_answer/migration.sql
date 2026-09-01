-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'AUDIO_ANSWER';

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "audioUrl" TEXT;
