<script lang="ts">
  import 'pennants/css/pennants.min.css';
  // Safe during SSR: registration is skipped where customElements is missing.
  import 'pennants/element/register';
  import ar from 'pennants/flags/ar';
  import type { PennantCode } from 'pennants';

  let code = $state<PennantCode>('br');
  const choices: PennantCode[] = ['br', 'mx', 'gb-eng'];
</script>

<h2>Per-flag module (in the prerendered HTML)</h2>
<!-- Trusted markup from pennants/flags/* only; never user input. -->
<span class="flag" role="img" aria-label="Argentina">{@html ar}</span>

<h2>CSS classes</h2>
<span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>

<h2>Web Component (lazy chunk per flag)</h2>
<pennant-flag {code} size="48"></pennant-flag>
{#each choices as choice (choice)}
  <button type="button" onclick={() => (code = choice)}>{choice}</button>
{/each}

<style>
  .flag {
    display: inline-block;
    height: 48px;
    aspect-ratio: 66 / 72;
  }
  .flag :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
