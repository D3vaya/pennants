import Image from 'next/image';
import { PennantSvg } from 'pennants/react';
import ar from 'pennants/flags/ar';
import jpUrl from 'pennants/svg/jp.svg';
import { FlagPicker } from './flag-picker';

// Server Component: everything here is rendered to HTML at build time.
export default function Page() {
  return (
    <main>
      <h2>PennantSvg (static import, in the HTML)</h2>
      <PennantSvg svg={ar} size={48} />

      <h2>CSS classes</h2>
      <span className="pn pn-de pn-2x" role="img" aria-label="Germany" />

      <h2>next/image</h2>
      <Image src={jpUrl} alt="Japan" height={48} width={44} />

      <h2>Client component (lazy chunk)</h2>
      <FlagPicker />
    </main>
  );
}
