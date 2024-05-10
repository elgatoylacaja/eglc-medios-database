import Link from "next/link";
import { handles_to_exclude } from "../../../scripts/0. common";
import prisma from "../../lib/prisma";

export default async function Page() {
  const channels = await prisma.channel.findMany();

  return (
    <div className="flex flex-col gap-1.5 flex-wrap max-h-dvh p-6">
      {channels
        .sort((c1, c2) => {
          if (handles_to_exclude.includes(c1.handle.toLowerCase())) return 1;
          if (handles_to_exclude.includes(c2.handle.toLowerCase())) return -1;
          return c1.handle.localeCompare(c2.handle);
        })
        .map((channel) => {
          return (
            <Link
              href={`/channels/${channel.handle.replace("@", "")}`}
              className={`flex gap-2 justify-start items-center hover:underline hover:text-blue-500 ${
                handles_to_exclude.includes(channel.handle.toLowerCase())
                  ? "bg-red-400/10"
                  : ""
              }`}
              key={channel.id}
            >
              <img
                className="w-8 h-8 rounded-full border border-black"
                src={channel.thumbnail}
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span>{channel.name}</span>
                <span className="text-xs text-gray-500">{channel.handle}</span>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
