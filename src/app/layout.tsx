import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

/* R36: GTM container GTM-WZJZTSKG. Head snippet as high in <head> as Next allows, plus the
   body <noscript> iframe immediately after the opening <body> tag. GA4 rides through this
   container (shared measurement property), no separate gtag snippet is added here. */
const GTM_ID = 'GTM-WZJZTSKG';

/* HIM-356: portfolio industry classification, emitted as `portfolio_category`
   on the GTM dataLayer so retargeting audiences can be segmented per brand
   category. Jaring is a horizontal B2B sales CRM (lead/deal/activity/quote
   pipeline for any industry's sales team, per README), which does not fit
   any of ecommerce/fashion/distributor/food-and-beverage/services/hotel (it
   is not itself a business in one of those verticals, it is software sold
   across verticals), so a new value "b2b-saas" is used rather than forcing
   a bad fit. This repo has no site.ts and no Meta Pixel client component,
   so this is a local constant like GTM_ID above. */
const PORTFOLIO_CATEGORY: string | null = 'b2b-saas';

/* ==========================================================================
   Layout root.

   Tipografi dikunci di DESIGN.md bagian 4: Plus Jakarta Sans untuk judul dan
   angka besar, Inter untuk isi dan tabel, JetBrains Mono untuk nomor dokumen.
   Ketiganya dimuat lewat next/font supaya di-host sendiri, jadi tidak ada
   permintaan ke domain pihak ketiga saat halaman dibuka.
   ========================================================================== */

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

/* Meta persis seperti yang dikunci BRAND.md bagian 9. */
export const metadata: Metadata = {
  metadataBase: new URL('https://portfolio-jaring.himaystudio.com'),
  title: 'Jaring, CRM Pipeline Penjualan. Portfolio App by Himay Studio',
  description:
    'Demo aplikasi CRM pipeline penjualan Jaring. Kelola lead, deal, aktivitas follow up, dan laporan sales. Dibuat oleh Himay Studio.',
  applicationName: 'Jaring',
  /* Merek fiktif untuk demo, jadi canonical mandiri ke subdomain portfolio
     sendiri, bukan ke domain klien mana pun (BRAND.md 9). */
  alternates: { canonical: 'https://portfolio-jaring.himaystudio.com/' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Jaring',
    title: 'Jaring, CRM Pipeline Penjualan. Portfolio App by Himay Studio',
    description:
      'Demo aplikasi CRM pipeline penjualan Jaring. Kelola lead, deal, aktivitas follow up, dan laporan sales. Dibuat oleh Himay Studio.',
    url: 'https://portfolio-jaring.himaystudio.com/',
    images: [{ url: '/og-jaring.png', width: 1200, height: 630, alt: 'Jaring, CRM pipeline penjualan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jaring, CRM Pipeline Penjualan. Portfolio App by Himay Studio',
    description:
      'Demo aplikasi CRM pipeline penjualan Jaring. Kelola lead, deal, aktivitas follow up, dan laporan sales. Dibuat oleh Himay Studio.',
    images: ['/og-jaring.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0D2229',
  width: 'device-width',
  initialScale: 1,
};

/* Status lipat sidebar dibaca SEBELUM React hidrasi, lalu dipasang sebagai
   atribut di <html>. Kalau dibaca lewat useEffect biasa, sidebar akan lahir
   selebar 248px lalu menyusut jadi 64px di frame berikutnya, dan seluruh isi
   halaman ikut melompat. */
const SKRIP_SIDEBAR = `try{var r=localStorage.getItem('jaring.sidebar.rail');document.documentElement.dataset.sidebar=r==='1'?'rail':'penuh'}catch(e){document.documentElement.dataset.sidebar='penuh'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categoryPush = PORTFOLIO_CATEGORY
    ? `window.dataLayer=window.dataLayer||[];window.dataLayer.push({portfolio_category:${JSON.stringify(PORTFOLIO_CATEGORY)}});`
    : '';
  return (
    <html lang="id" data-sidebar="penuh">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_SIDEBAR }} />
        <Script id="gtm-head" strategy="afterInteractive">
          {`${categoryPush}(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className={`${display.variable} ${ui.variable} ${mono.variable}`}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
