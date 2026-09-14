import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DwellGuard: Keep the dock plan moving",
  description:
    "Coordinates late freight dock appointments by turning driver limits into a confirmed, provable plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${newsreader.variable} min-h-screen bg-canvas-main text-ink-primary`}>
        <div className="min-h-screen md:grid md:grid-cols-[224px_minmax(0,1fr)]">
          <Navigation />
          <main className="min-w-0 w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9 2xl:px-14">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
