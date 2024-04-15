import Link from "next/link";
import prisma from "../../../lib/prisma";
import ChannelCard from "../../../components/ChannelCard";

export default async function Page() {
  const channels = await prisma.channel.findMany();

  return (
    <div className="flex flex-col gap-1.5 flex-wrap max-h-[calc(100dvh-48px)]">
      {channels
        .sort((c1, c2) => {
          return c1.handle.localeCompare(c2.handle);
        })
        .map((channel) => {
          return (
            <Link
              href={`/youtube/channels/${channel.handle.replace("@", "")}`}
              className="flex gap-2 justify-start items-center hover:underline hover:text-blue-500"
              key={channel.id}
            >
              <img className="w-8 h-8 rounded-full" src={channel.thumbnail} />
              <span>{channel.name}</span> - <span>{channel.handle}</span>
            </Link>
          );
        })}
    </div>
  );
}
