/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/channels",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "yt2.googleusercontent.com" },
      { protocol: "https", hostname: "yt1.googleusercontent.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
};

module.exports = nextConfig;
