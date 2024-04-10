/*
  Warnings:

  - You are about to alter the column `viewCount` on the `Video` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `viewCount` on the `Channel` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "viewCount" BIGINT NOT NULL,
    "likeCount" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("channelId", "commentCount", "duration", "id", "likeCount", "publishedAt", "title", "viewCount") SELECT "channelId", "commentCount", "duration", "id", "likeCount", "publishedAt", "title", "viewCount" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE TABLE "new_Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL,
    "viewCount" BIGINT NOT NULL
);
INSERT INTO "new_Channel" ("handle", "id", "name", "subscriberCount", "videoCount", "viewCount") SELECT "handle", "id", "name", "subscriberCount", "videoCount", "viewCount" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
