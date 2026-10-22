<script lang="ts">
  import 'pennants/css';
  // Safe during SSR: registration is skipped where customElements is missing.
  import 'pennants/element/register';
  import ar from 'pennants/art/1x1/ar';
  import { SHAPES, renderFlag, type PennantCode, type PennantShape } from 'pennants';

  let code = $state<PennantCode>('br');
  let shape = $state<PennantShape>('pennant');
  const codes: PennantCode[] = ['br', 'mx', 'gb-eng'];
</script>

<h2>Art module + renderFlag (in the prerendered HTML)</h2>
<!-- Trusted markup composed from pennants/art/*; never user input. -->
<span class="flag" role="img" aria-label="Argentina">{@html renderFlag(ar, { shape: 'circle' })}</span>

<h2>CSS classes</h2>
<span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>

<h2>Web Component (lazy chunk per flag)</h2>
<pennant-flag {code} {shape} size="48"></pennant-flag>
{#each codes as choice (choice)}
  <button type="button" onclick={() => (code = choice)}>{choice}</button>
{/each}
{#each SHAPES as choice (choice)}
  <button type="button" onclick={() => (shape = choice)}>{choice}</button>
{/each}

<style>
  .flag {
    display: inline-block;
    height: 48px;
    aspect-ratio: 1;
  }
  .flag :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
