-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_90_DAYS', 'PRO_MONTHLY', 'PRO_ANNUAL');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('GMAIL', 'GOOGLE_DRIVE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('RECEIPT', 'INVOICE', 'TAX_FORM_W9_1099', 'CONTRACT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "googleId" TEXT NOT NULL,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_90_DAYS',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "isSyncing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "DocumentSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'UNKNOWN',
    "merchantName" TEXT,
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "documentDate" TIMESTAMP(3),
    "taxYear" INTEGER,
    "rawOcrText" TEXT NOT NULL,
    "embedding" vector(384),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "ingestedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "Document_userId_documentDate_idx" ON "Document"("userId", "documentDate");

-- CreateIndex
CREATE INDEX "Document_userId_category_idx" ON "Document"("userId", "category");

-- CreateIndex
CREATE INDEX "Document_userId_taxYear_idx" ON "Document"("userId", "taxYear");

-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_sourceChecksum_key" ON "Document"("userId", "sourceChecksum");

-- CreateIndex
CREATE INDEX "SyncLog_userId_idx" ON "SyncLog"("userId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
