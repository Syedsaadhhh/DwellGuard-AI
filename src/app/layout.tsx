import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "DwellGuard — Keep the dock plan moving",
  description:
    "Coordinates late freight dock appointments by turning driver limits into the next CALL-E request and returning the confirmed plan to the driver.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-main text-ink-primary flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
