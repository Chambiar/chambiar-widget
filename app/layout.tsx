import type { Metadata } from 'next';
import Image from 'next/image';
import '@/app/globals.css';
import { cn } from '@/lib/utils';
import { Manrope } from 'next/font/google';
import WidgetNavbar from '@/components/widget/WidgetNavbar';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Chambiar — Work System Snapshot',
  description: 'Find out how your work system is affecting your productivity. Free assessment by Chambiar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(manrope.variable, 'font-sans')} suppressHydrationWarning>
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