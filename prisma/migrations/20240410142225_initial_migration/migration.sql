-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL,
    "viewCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "viewCount" INTEGER NOT NULL,
    "likeCount" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textDisplay" TEXT NOT NULL,
    "authorChannelUrl" TEXT NOT NULL,
    "authorChannelId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    CONSTRAINT "Comment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
