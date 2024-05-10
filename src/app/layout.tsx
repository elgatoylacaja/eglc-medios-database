import { Montserrat, Overpass_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
        <main
          className={`p-6 ${montserrat.variable} ${overpass_mono.variable} font-sans`}
        >
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
