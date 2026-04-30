import { Montserrat, Overpass_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});

const overpass_mono = Overpass_Mono({
  variable: "--font-overpass-mono",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          <main
            className={`${montserrat.variable} ${overpass_mono.variable} font-sans min-h-dvh`}
          >
            {children}
          </main>
        </NuqsAdapter>
      </body>
    </html>
  );
}
