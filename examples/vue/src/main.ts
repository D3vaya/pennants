import { createApp } from 'vue';
// Registers <pennant-flag> once for the whole app.
import 'pennants/element/register';
import App from './App.vue';

createApp(App).mount('#app');
