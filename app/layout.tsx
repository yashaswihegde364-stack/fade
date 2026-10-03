import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SplashIntro from "@/components/SplashIntro";
import CursorGlow from "@/components/CursorGlow";
import PageTransition from "@/components/PageTransition";
import WelcomeNote from "@/components/WelcomeNote";
import GlobalCapture from "@/components/GlobalCapture";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fade — Starts loud. Gets quiet. You keep going.",
  description:
    "Fade is a focus app for ADHD brains. Sessions start loud with motion, sound and rewards, then quietly fade until you're working with almost nothing on screen.",
  openGraph: {
    title: "Fade",
    description: "Starts loud. Gets quiet. You keep going.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fade",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)] font-body">
        <CursorGlow />
        <SplashIntro />
        <WelcomeNote />
        <GlobalCapture />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
