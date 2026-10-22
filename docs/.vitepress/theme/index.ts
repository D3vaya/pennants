import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';
import CodesTable from './components/CodesTable.vue';
import CopyCode from './components/CopyCode.vue';
import FormatPicker from './components/FormatPicker.vue';
import HeroBunting from './components/HeroBunting.vue';
import MigrationCompare from './components/MigrationCompare.vue';
import PennantGallery from './components/PennantGallery.vue';
import ThemePlayground from './components/ThemePlayground.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-image': () => h(HeroBunting) }),
  enhanceApp({ app }) {
    app.component('CodesTable', CodesTable);
    app.component('CopyCode', CopyCode);
    app.component('FormatPicker', FormatPicker);
    app.component('MigrationCompare', MigrationCompare);
    app.component('PennantGallery', PennantGallery);
    app.component('ThemePlayground', ThemePlayground);
    // Registers <pennant-flag> in the browser only; the module is SSR-safe anyway.
    if (!import.meta.env.SSR) {
      void import('pennants/element').then(({ definePennantElement }) => definePennantElement());
    }
  },
} satisfies Theme;
