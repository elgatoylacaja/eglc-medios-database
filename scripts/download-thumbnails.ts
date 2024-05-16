import prisma from "../src/lib/prisma"
import fs from 'fs'

async function main() {
  const channels = await prisma.channel.findMany()

  // Download thumbnails to /public/thumbnails
  // Use the channel handle as the filename
  // Use the channel thumbnail as the URL
  for (const channel of channels) {
    const thumbnail = channel.thumbnail
    const handle = channel.handle
    const filename = `public/thumbnails/${handle}.jpg`
    
    const response = await fetch(thumbnail)
    const buffer = await response.arrayBuffer()

    fs.writeFileSync(filename, Buffer.from(buffer))
  }

}

main()