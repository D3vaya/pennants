/**
 * `pennants/react/static`: only the synchronous `PennantSvg` (no client
 * component, no loader map anywhere in the module graph). `pennants/react`
 * re-exports the same component; this subpath exists for bundlers such as
 * esbuild that emit every reachable `import()` chunk even when unused.
 */
export { PennantSvg, type PennantSvgProps } from './svg.tsx';
export {
  pennantBox,
  type PennantBox,
  type PennantCommonProps,
  type PennantHtmlAttributes,
  type PennantSize,
} from './shared.ts';
