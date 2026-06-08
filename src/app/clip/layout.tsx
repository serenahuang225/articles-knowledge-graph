import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clip Article",
  robots: { index: false, follow: false },
};

export default function ClipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
