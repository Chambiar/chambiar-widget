import type { Metadata } from 'next';
import Image from 'next/image';
import '@/app/globals.css';
import { cn } from '@/lib/utils';
import { Quicksand, Space_Mono, Caveat } from 'next/font/google';
import WidgetNavbar from '@/components/widget/WidgetNavbar';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hand',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const SITE_URL = 'https://workreceipt.chambiar.ai';
const OG_TITLE = 'Work Receipt — Free Work Time Audit';
const DESCRIPTION =
  "See where your work time actually goes. Work Receipt is Chambiar's free 2-minute audit of your workday — coordination, context-switching, and real work, itemized.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Work Receipt — Free Work Time Audit | Chambiar',
  description: DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: OG_TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    type: 'website',
    siteName: 'Chambiar',
    images: ['/Chambiar Logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: DESCRIPTION,
    images: ['/Chambiar Logo.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(quicksand.variable, spaceMono.variable, caveat.variable, 'font-sans')}
      suppressHydrationWarning
    >
      <body className="text-foreground h-screen overflow-hidden flex flex-col bg-white">
        <WidgetNavbar />
        <main className="flex-1 flex flex-col pt-[72px]">
          {children}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 border-t border-white/50 bg-white/70 backdrop-blur-xl py-1.5 text-center">
          <Image
            src="/Chambiar Logo.svg"
            alt="Chambiar"
            width={56}
            height={16}
            style={{ height: "auto" }}
            className="object-contain opacity-60"
          />
          <p className="text-[10px] text-[#7c8aa6]">&copy; {new Date().getFullYear()} Chambiar</p>
        </footer>
      </body>
    </html>
  );
}
