ALTER TABLE "messages"
ADD COLUMN "whatsappMessageId" TEXT,
ADD COLUMN "botResponse" TEXT,
ADD COLUMN "botResponseSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "messages_whatsappMessageId_key"
ON "messages"("whatsappMessageId");
