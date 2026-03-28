import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider as FeatureAuthProvider } from "./features/auth/AuthContext";
import { AuthProvider as LibAuthProvider } from "./lib/context/AuthContext";
import { Toaster } from "react-hot-toast";

// Define fonts using next/font/google
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LegalVoice.ai — Voice-Powered Legal Assistant",
  description:
    "AI-powered legal assistant supporting 8 regional Indian languages via voice. " +
    "Whisper speech recognition, hybrid RAG retrieval, agentic document automation, " +
    "and AI document drafting — all in one platform.",
  keywords: [
    "legal AI", "voice to text", "Indian law", "legal documents",
    "Whisper", "RAG", "multilingual", "AutoGen", "LangChain",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans`}>
        <LibAuthProvider>
          <FeatureAuthProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster position="top-right" toastOptions={{
              style: {
                fontFamily: 'var(--font-space-grotesk)',
                background: '#1a1a2e',
                color: '#e2e8f0',
                border: '1px solid #4b31da',
              },
            }} />
          </FeatureAuthProvider>
        </LibAuthProvider>
      </body>
    </html>
  );
}
