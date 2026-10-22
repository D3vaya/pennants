import type { ReactNode } from 'react';
// Global stylesheet for the `pn pn-xx` classes (pennant shape).
import 'pennants/css';

export const metadata = { title: 'pennants + Next.js' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
