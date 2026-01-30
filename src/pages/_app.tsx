import type { AppProps } from "next/app";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
