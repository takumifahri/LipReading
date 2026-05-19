import "./globals.css";
import Link from 'next/link';

export const metadata = {
  title: "LipReading AI | Real-time Recognition",
  description: "Advanced lip reading and landmark analysis using MediaPipe and TensorFlow.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="w-full bg-[#07070a] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-white">LipReading.AI</Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm text-zinc-300 hover:text-white">Home</Link>
              <Link href="/words" className="text-sm text-zinc-300 hover:text-white">Words</Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
