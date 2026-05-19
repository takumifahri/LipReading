import "./globals.css";

export const metadata = {
  title: "LipReading AI | Real-time Recognition",
  description: "Advanced lip reading and landmark analysis using MediaPipe and TensorFlow.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
