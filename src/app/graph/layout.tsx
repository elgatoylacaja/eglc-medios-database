import "@react-sigma/core/lib/react-sigma.min.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
