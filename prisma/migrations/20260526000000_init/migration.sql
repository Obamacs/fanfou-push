-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'ACTIVE', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "CouponReason" AS ENUM ('REGISTER', 'INVITED_SOMEONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "ageGroup" TEXT,
    "gender" "Gender",
    "bio" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "avatarUrl" TEXT,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "canCreateEvents" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "subscriptionId" TEXT,
    "averageRating" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "relationshipGoal" TEXT,
    "smokingHabit" TEXT,
    "drinkingHabit" TEXT,
    "wantsChildren" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLocationUpdate" TIMESTAMP(3),
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "proExpireAt" TIMESTAMP(3),
    "refundMethod" TEXT,
    "refundAccount" TEXT,
    "refundRealName" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "userId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId","interestId")
);

-- CreateTable
CREATE TABLE "QuestionnaireQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionnaireQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "city" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchMember" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MatchMember_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "maxAttendees" INTEGER NOT NULL DEFAULT 6,
    "priceAmount" INTEGER NOT NULL DEFAULT 0,
    "priceCurrency" TEXT NOT NULL DEFAULT 'usd',
    "estimatedSpend" TEXT,
    "estimatedSpicy" TEXT,
    "estimatedCuisine" TEXT,
    "alcoholPolicy" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "creatorId" TEXT NOT NULL,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendance" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reportedEventId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteCodeUsage" (
    "id" TEXT NOT NULL,
    "inviteCodeId" TEXT NOT NULL,
    "newUserId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedUserFirstEventAt" TIMESTAMP(3),
    "inviterRewardClaimedAt" TIMESTAMP(3),

    CONSTRAINT "InviteCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeCoupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "welcomeText" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedForEventId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" "CouponReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "depositFee" INTEGER NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refundStatus" TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE',
    "refundedAt" TIMESTAMP(3),
    "refundOperator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_isBanned_idx" ON "User"("isBanned");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE INDEX "QuestionnaireQuestion_order_idx" ON "QuestionnaireQuestion"("order");

-- CreateIndex
CREATE INDEX "QuestionnaireAnswer_userId_idx" ON "QuestionnaireAnswer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireAnswer_userId_questionId_key" ON "QuestionnaireAnswer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_city_idx" ON "Match"("city");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE INDEX "MatchMember_userId_idx" ON "MatchMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_matchId_key" ON "Event"("matchId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_city_idx" ON "Event"("city");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_creatorId_idx" ON "Event"("creatorId");

-- CreateIndex
CREATE INDEX "Event_matchId_idx" ON "Event"("matchId");

-- CreateIndex
CREATE INDEX "EventAttendance_userId_idx" ON "EventAttendance"("userId");

-- CreateIndex
CREATE INDEX "EventAttendance_status_idx" ON "EventAttendance"("status");

-- CreateIndex
CREATE INDEX "Message_eventId_idx" ON "Message"("eventId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");

-- CreateIndex
CREATE INDEX "DirectMessage_receiverId_idx" ON "DirectMessage"("receiverId");

-- CreateIndex
CREATE INDEX "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_isRead_idx" ON "DirectMessage"("isRead");

-- CreateIndex
CREATE INDEX "Rating_eventId_idx" ON "Rating"("eventId");

-- CreateIndex
CREATE INDEX "Rating_ratedUserId_idx" ON "Rating"("ratedUserId");

-- CreateIndex
CREATE INDEX "Rating_createdAt_idx" ON "Rating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_eventId_raterId_ratedUserId_key" ON "Rating"("eventId", "raterId", "ratedUserId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_ownerId_idx" ON "InviteCode"("ownerId");

-- CreateIndex
CREATE INDEX "InviteCode_code_idx" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "InviteCode_isActive_idx" ON "InviteCode"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCodeUsage_newUserId_key" ON "InviteCodeUsage"("newUserId");

-- CreateIndex
CREATE INDEX "InviteCodeUsage_inviteCodeId_idx" ON "InviteCodeUsage"("inviteCodeId");

-- CreateIndex
CREATE INDEX "InviteCodeUsage_inviterRewardClaimedAt_idx" ON "InviteCodeUsage"("inviterRewardClaimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FreeCoupon_code_key" ON "FreeCoupon"("code");

-- CreateIndex
CREATE INDEX "FreeCoupon_userId_idx" ON "FreeCoupon"("userId");

-- CreateIndex
CREATE INDEX "FreeCoupon_isUsed_idx" ON "FreeCoupon"("isUsed");

-- CreateIndex
CREATE INDEX "FreeCoupon_expiresAt_idx" ON "FreeCoupon"("expiresAt");

-- CreateIndex
CREATE INDEX "FreeCoupon_code_idx" ON "FreeCoupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationOrder_orderCode_key" ON "ReservationOrder"("orderCode");

-- CreateIndex
CREATE INDEX "ReservationOrder_userId_idx" ON "ReservationOrder"("userId");

-- CreateIndex
CREATE INDEX "ReservationOrder_eventId_idx" ON "ReservationOrder"("eventId");

-- CreateIndex
CREATE INDEX "ReservationOrder_status_idx" ON "ReservationOrder"("status");

-- CreateIndex
CREATE INDEX "ReservationOrder_orderCode_idx" ON "ReservationOrder"("orderCode");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireAnswer" ADD CONSTRAINT "QuestionnaireAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionnaireQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMember" ADD CONSTRAINT "MatchMember_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMember" ADD CONSTRAINT "MatchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedEventId_fkey" FOREIGN KEY ("reportedEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCodeUsage" ADD CONSTRAINT "InviteCodeUsage_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCodeUsage" ADD CONSTRAINT "InviteCodeUsage_newUserId_fkey" FOREIGN KEY ("newUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeCoupon" ADD CONSTRAINT "FreeCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeCoupon" ADD CONSTRAINT "FreeCoupon_usedForEventId_fkey" FOREIGN KEY ("usedForEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationOrder" ADD CONSTRAINT "ReservationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationOrder" ADD CONSTRAINT "ReservationOrder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

