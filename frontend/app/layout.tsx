import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Storytelling — Self-hosted TTS",
  description: "Generate professional English narration with Chatterbox TTS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-[#0a0a0c] text-neutral-100 flex font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}

