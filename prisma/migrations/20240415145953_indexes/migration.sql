-- CreateIndex
CREATE INDEX "idx_channel_handle" ON "Channel"("handle");

-- CreateIndex
CREATE INDEX "idx_channel_publishedAt" ON "Channel"("publishedAt");

-- CreateIndex
CREATE INDEX "idx_comment_channelId" ON "Comment"("channelId");

-- CreateIndex
CREATE INDEX "idx_comment_videoId" ON "Comment"("videoId");

-- CreateIndex
CREATE INDEX "idx_comment_authorId" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "idx_video_channelId" ON "Video"("channelId");

-- CreateIndex
CREATE INDEX "idx_video_publishedAt" ON "Video"("publishedAt");
