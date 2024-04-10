import prisma from "../lib/prisma";
import ChannelList from "../views/ChannelsList";

export default async function Home() {
  const channels = await prisma.channel.findMany({});
  return <ChannelList channels={channels} />;
}
