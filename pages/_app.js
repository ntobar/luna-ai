import Head from 'next/head';

import '../styles/globals.css';

const MyApp = ({ Component, pageProps }) => (
  <>
    <Head>
      <title>Luna</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" sizes="32x32" href="/favicon2.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/lunalogoround-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/lunalogoround-32x32.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/lunalogoround-96x96.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/lunalogoround-180x180.png" />
      <link rel="preconnect" href="https://stijndv.com" />
      <link rel="stylesheet" href="https://stijndv.com/fonts/Eudoxus-Sans.css" />
    </Head>
    <Component {...pageProps} />
  </>
);

export default MyApp;
