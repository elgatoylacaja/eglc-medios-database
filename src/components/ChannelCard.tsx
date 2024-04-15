import { Calendar, User, Video } from "react-feather";
import { ChannelItem } from "../lib/types";
import { getThumbnail } from "../lib/utils";

export default function ChannelCard(props: { channel: ChannelItem }) {
  const {
    channel: {
      brandingSettings: {
        image: { bannerExternalUrl } = { bannerExternalUrl: "" },
      },
      snippet: { thumbnails, title, customUrl, publishedAt },
      statistics,
    },
  } = props;

  return (
    <div className="relative rounded-lg w-fit overflow-hidden">
      {bannerExternalUrl !== "" ? (
        <img
          className="aspect-video w-[512px] bg-black"
          src={bannerExternalUrl}
          alt="Banner"
        />
      ) : (
        <div className="aspect-video w-[512px] bg-black" />
      )}
      <div className="flex flex-col gap-2 absolute p-2 bottom-0 left-0 w-full bg-white/80">
        <div className="flex gap-2">
          <img
            className="w-12 h-12 rounded-full"
            src={getThumbnail(thumbnails)}
          />
          <div className="flex flex-col leading-none">
            <h1 className="text-xl">{title}</h1>
            <span className="text-xs">{customUrl}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <Video size={12} />
            <span>
              Videos:{" "}
              {parseInt(statistics.videoCount)
                .toLocaleString()
                .replace(",", ".")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <User size={12} />
            <span>
              Subscribers:{" "}
              {parseInt(statistics.subscriberCount)
                .toLocaleString()
                .replace(",", ".")}
            </span>
          </div>
          <div className="flex justify-center items-center py-1 bg-white rounded px-2 gap-1 text-xs">
            <Calendar size={12} />
            <span>
              Created at: {new Date(publishedAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
