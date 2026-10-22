'use client';

import { useState } from 'react';
import { Pennant } from 'pennants/react';
import type { PennantCode } from 'pennants';

const choices: PennantCode[] = ['br', 'mx', 'gb-eng'];

export function FlagPicker() {
  const [code, setCode] = useState<PennantCode>('br');
  return (
    <p>
      <Pennant code={code} size={48} />
      {choices.map((choice) => (
        <button key={choice} type="button" onClick={() => setCode(choice)}>
          {choice}
        </button>
      ))}
    </p>
  );
}
