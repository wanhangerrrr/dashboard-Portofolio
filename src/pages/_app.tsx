import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import * as gtag from "@/lib/gtag";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };

    // Initial tracking on first load
    if (gtag.GA_MEASUREMENT_ID) {
      gtag.pageview(router.asPath);
    }

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, router.asPath]);

  return (
    <main className={`${inter.variable} ${spaceGrotesk.variable}`}>
      {/* GA4 Setup */}
      {gtag.GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${gtag.GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                send_page_view: false, // Prevent double hits in SPA
                anonymize_ip: true,
                allow_ad_personalization_signals: false,
                allow_google_signals: false
              });
            `}
          </Script>
        </>
      )}
      <Component {...pageProps} />
    </main>
  );
}
