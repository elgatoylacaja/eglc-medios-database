import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ThumbsUp } from "react-feather";
import VideoCard from "../../../../../components/VideoCard";
import { YoutubeAPI } from "../../../../../lib/youtube";
import prisma from "../../../../../lib/prisma";

type Props = {
  params: { id: string; handle: string };
};

export default async function Page(props: Props) {
  const {
    params: { id, handle },
  } = props;

  const video = await prisma.video.findUnique({
    where: {
      id,
    },
  });

  if (video === null) {
    return notFound();
  }

  const comments = await prisma.comment.count({
    where: { videoId: id },
  });

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={`/channels/${handle}`}
        className={
          "flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs transition-color"
        }
      >
        <ArrowLeft size={12} />
        <span>Back</span>
      </Link>
      <VideoCard video={video} key={video.id} className="max-w-96" />
      <div className="flex flex-col gap-4">
        <span>Video comments: {video.commentCount}</span>
        <span>Saved comments: {comments}</span>
        {/* {comments
          .sort((a, b) => {
            return a.snippet.topLevelComment.snippet.likeCount <
              b.snippet.topLevelComment.snippet.likeCount
              ? 1
              : -1;
          })
          .map(
            ({
              id,
              replies,
              snippet: {
                topLevelComment: { snippet },
              },
            }) => (
              <div key={id} className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <img
                    src={snippet.authorProfileImageUrl}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>{snippet.textOriginal}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
                    <ThumbsUp size={12} />
                    <span>Likes: {snippet.likeCount}</span>
                  </div>

                  <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
                    <Calendar size={12} />
                    <span>
                      Date:{" "}
                      {new Date(snippet.publishedAt).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                {replies && (
                  <div className="ml-10 flex flex-col gap-2">
                    {replies.comments
                      .sort((a, b) => {
                        return a.snippet.publishedAt < b.snippet.publishedAt
                          ? 1
                          : -1;
                      })
                      .map(
                        ({
                          snippet: {
                            authorProfileImageUrl,
                            textDisplay,
                            likeCount,
                            publishedAt,
                          },
                          id,
                        }) => (
                          <div className="flex flex-col gap-1" key={id}>
                            <div className="flex gap-2">
                              <img
                                src={authorProfileImageUrl}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>{textDisplay}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
                                <ThumbsUp size={12} />
                                <span>Likes: {likeCount}</span>
                              </div>

                              <div className="flex justify-center items-center py-1 bg-black/5 w-fit rounded px-2 gap-1 text-xs">
                                <Calendar size={12} />
                                <span>
                                  Date:{" "}
                                  {new Date(publishedAt).toLocaleString(
                                    "es-AR"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            )
          )} */}
      </div>
    </div>
  );
}
