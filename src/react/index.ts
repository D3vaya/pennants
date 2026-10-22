/**
 * `pennants/react`. Safe to import from React Server Components:
 * `PennantSvg` renders on the server, while `Pennant` comes from a separate
 * `'use client'` module (a client reference when imported from the server).
 */
export * from './static.ts';
export { Pennant, type PennantProps } from './client.tsx';
