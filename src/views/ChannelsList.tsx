"use client";
import Link from "next/link";
import { Trash } from "react-feather";
import { toast } from "sonner";

type Channel = {
  id: string;
  name: string;
  handle: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
};

export default async function ChannelList(props: { channels: Channel[] }) {
  const { channels } = props;
  return (
    <div className="flex flex-col gap-0.5">
      {channels.map((channel) => (
        <div
          key={channel.id}
          className="flex gap-2 justify-center items-center w-fit"
        >
          <Link href={`/channels/${channel.id}`} className="text-black hover:underline">
            {channel.handle}
          </Link>
          <button
            onClick={() => {
              fetch(`/api/channel/${channel.id}`, {
                method: "DELETE",
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log(data);
                  toast.success("Channel deleted successfully");
                })
                .catch((e) => {
                  console.error(e);
                  toast.error("Failed to delete channel");
                });
            }}
          >
            <Trash color="red" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
