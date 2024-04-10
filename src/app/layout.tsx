import { Toaster } from "sonner";
import "./globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
