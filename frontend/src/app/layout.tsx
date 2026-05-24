import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clara",
  description: "Premium AI skincare assistant with clinical routines and product guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
