import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GestureAI | Real-time ASL Translation",
  description: "Next-gen American Sign Language translation powered by machine learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} bg-black text-gray-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
