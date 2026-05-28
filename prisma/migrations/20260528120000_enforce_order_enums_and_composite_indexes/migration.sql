-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NOT_ELIGIBLE', 'ELIGIBLE', 'REFUNDED', 'FORFEITED');

-- AlterTable (Step 1: Drop Default constraints)
ALTER TABLE "ReservationOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ReservationOrder" ALTER COLUMN "refundStatus" DROP DEFAULT;

-- AlterTable (Step 2: Alter Type with explicit USING cast)
ALTER TABLE "ReservationOrder" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus";
ALTER TABLE "ReservationOrder" ALTER COLUMN "refundStatus" TYPE "RefundStatus" USING "refundStatus"::"RefundStatus";

-- AlterTable (Step 3: Set Enum Default constraints)
ALTER TABLE "ReservationOrder" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "ReservationOrder" ALTER COLUMN "refundStatus" SET DEFAULT 'NOT_ELIGIBLE';

-- DropIndex
DROP INDEX IF EXISTS "User_email_idx";

-- CreateIndex
CREATE INDEX "User_city_isOnboarded_isActive_isBanned_idx" ON "User"("city", "isOnboarded", "isActive", "isBanned");

-- CreateIndex
CREATE INDEX "EventAttendance_eventId_status_idx" ON "EventAttendance"("eventId", "status");

-- CreateIndex
CREATE INDEX "DirectMessage_receiverId_isRead_senderId_idx" ON "DirectMessage"("receiverId", "isRead", "senderId");

-- CreateIndex
CREATE INDEX "FreeCoupon_userId_isUsed_expiresAt_idx" ON "FreeCoupon"("userId", "isUsed", "expiresAt");
