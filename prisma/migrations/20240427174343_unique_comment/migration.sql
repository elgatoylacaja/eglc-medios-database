/*
  Warnings:

  - A unique constraint covering the columns `[channelId,videoId,authorId,publishedAt]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "idx_comment_publishedAt" ON "Comment"("publishedAt");

-- CreateIndex
CREATE INDEX "idx_comment_videoPublishedAt" ON "Comment"("videoPublishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_channelId_videoId_authorId_publishedAt_key" ON "Comment"("channelId", "videoId", "authorId", "publishedAt");
