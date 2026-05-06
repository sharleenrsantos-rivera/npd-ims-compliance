import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>NPD IMS Compliance Engine</title>
        <meta name="description" content="NPD IMS Pre-Assessment Compliance Engine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%231F2A44'/%3E%3Cpath d='M28 62 L50 30 L72 62 Z' fill='%23E8512A'/%3E%3C/svg%3E"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
