import { registerRootComponent } from 'expo';
import App from './App';

if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('pointerEvents')) return;
    originalWarn(...args);
  };
}

registerRootComponent(App);
