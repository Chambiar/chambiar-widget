import type { Metadata } from 'next';
import Image from 'next/image';
import '@/app/globals.css';
import { cn } from '@/lib/utils';
import { Quicksand, Space_Mono } from 'next/font/google';
import WidgetNavbar from '@/components/widget/WidgetNavbar';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
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
      className={cn(quicksand.variable, spaceMono.variable, 'font-sans')}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <WidgetNavbar />
        <main className="flex-1 flex flex-col pt-[72px]">
          {children}
        </main>
        <footer className="border-t border-[#e2e8f0] py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image
              src="/Chambiar Logo.svg"
              alt="Chambiar"
              width={80}
              height={24}
              style={{ height: "auto" }}
              className="object-contain opacity-60"
            />
          </div>
          <p className="text-xs text-[#94A9C2]">&copy; {new Date().getFullYear()} Chambiar</p>
        </footer>
      </body>
    </html>
  );
}
