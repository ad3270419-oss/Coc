import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';
import App from './App.tsx';
import './index.css';

async function initNativeEdgeToEdgeStatusBar() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
  } catch {
    // Ignore on platforms where status bar customization is unsupported
  }
}

void initNativeEdgeToEdgeStatusBar();
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);


