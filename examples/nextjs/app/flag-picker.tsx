'use client';

import { useState } from 'react';
import { Pennant } from 'pennants/react';
import { SHAPES, type PennantCode, type PennantShape } from 'pennants';

const codes: PennantCode[] = ['br', 'mx', 'gb-eng'];

export function FlagPicker() {
  const [code, setCode] = useState<PennantCode>('br');
  const [shape, setShape] = useState<PennantShape>('circle');
  return (
    <p>
      <Pennant code={code} shape={shape} size={48} />
      {codes.map((choice) => (
        <button key={choice} type="button" onClick={() => setCode(choice)}>
          {choice}
        </button>
      ))}
      {SHAPES.map((choice) => (
        <button key={choice} type="button" onClick={() => setShape(choice)}>
          {choice}
        </button>
      ))}
    </p>
  );
}
