/** テスト環境のセットアップ */

import { config } from '@vue/test-utils';
import { vi } from 'vitest';

import ResizeObserver from 'resize-observer-polyfill';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import * as labsComponents from 'vuetify/labs/components';

// Vuetifyインスタンス作成
export const vuetifyInstance = createVuetify({
  components: { ...components, ...labsComponents },
  directives,
  theme: {
    defaultTheme: 'light'
  }
});

// Vue Test Utils設定
config.global.plugins = [vuetifyInstance];

// Polyfillの設定
globalThis.ResizeObserver = ResizeObserver;

// Vitest環境でのCSSのモック
globalThis.CSS = {
  ...globalThis.CSS,
  supports: vi.fn(() => true)
};

// URLパターンのモック
globalThis.URL.createObjectURL = vi.fn(() => 'mock-object-url');
globalThis.URL.revokeObjectURL = vi.fn();

// Canvas描画のモック（OpenLayers用）
/* eslint-disable @typescript-eslint/no-explicit-any */
(HTMLCanvasElement.prototype.getContext as any) = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn()
}));

// globalThis.matchMediaのモック
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// navigator.geolocationのモック
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  }
});

// IntersectionObserverのモック
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// MutationObserverのモック
(globalThis as any).MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn()
}));

// Blobのモック
(globalThis as any).Blob = vi.fn().mockImplementation((parts, properties) => ({
  size: parts?.reduce((acc: number, part: string) => acc + part.length, 0) ?? 0,
  type: properties?.type ?? '',
  parts,
  properties
}));

// FileReaderのモック
(globalThis as any).FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  onload: null,
  onerror: null,
  result: null
}));

// requestAnimationFrameのモック
(globalThis as any).requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
(globalThis as any).cancelAnimationFrame = vi.fn(id => clearTimeout(id));
/* eslint-enable @typescript-eslint/no-explicit-any */

export default {};
