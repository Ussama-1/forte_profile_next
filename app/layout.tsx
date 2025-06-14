import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "./AuthProvider";

export const metadata: Metadata = {
  title: "FORTE: QUANTUM",
  description: "FINDING YOUR FORTE: QUANTUM LEAP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased h-screen overflow-y-auto `}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
