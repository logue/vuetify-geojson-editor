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
  supports: vi.fn<() => boolean>(() => true)
};

// URLパターンのモック
globalThis.URL.createObjectURL = vi.fn<() => string>(() => 'mock-object-url');
globalThis.URL.revokeObjectURL = vi.fn<() => void>();

// Vuetifyが参照するvisualViewportのモック
Object.defineProperty(globalThis, 'visualViewport', {
  writable: true,
  value: {
    width: 1280,
    height: 720,
    scale: 1,
    offsetLeft: 0,
    offsetTop: 0,
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>()
  }
});

// Canvas描画のモック（OpenLayers用）
/* eslint-disable @typescript-eslint/no-explicit-any -- Canvas mock requires dynamic typing for OpenLayers compatibility */
(HTMLCanvasElement.prototype.getContext as any) = vi.fn<() => void>(() => ({
  fillRect: vi.fn<() => void>(),
  clearRect: vi.fn<() => void>(),
  getImageData: vi.fn<() => { data: number[] }>(() => ({ data: [] })),
  putImageData: vi.fn<() => void>(),
  createImageData: vi.fn<() => any>(() => []),
  setTransform: vi.fn<() => void>(),
  drawImage: vi.fn<() => void>(),
  save: vi.fn<() => void>(),
  fillText: vi.fn<() => void>(),
  restore: vi.fn<() => void>(),
  beginPath: vi.fn<() => void>(),
  moveTo: vi.fn<() => void>(),
  lineTo: vi.fn<() => void>(),
  closePath: vi.fn<() => void>(),
  stroke: vi.fn<() => void>(),
  translate: vi.fn<() => void>(),
  scale: vi.fn<() => void>(),
  rotate: vi.fn<() => void>(),
  arc: vi.fn<() => void>(),
  fill: vi.fn<() => void>(),
  measureText: vi.fn<() => { width: number }>(() => ({ width: 0 })),
  transform: vi.fn<() => void>(),
  rect: vi.fn<() => void>(),
  clip: vi.fn<() => void>()
}));

// globalThis.matchMediaのモック
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn<(query: string) => MediaQueryList>().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn<() => void>(),
    removeListener: vi.fn<() => void>(),
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
    dispatchEvent: vi.fn<(event: Event) => boolean>()
  }))
});

// navigator.geolocationのモック
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn<() => void>(),
    watchPosition: vi.fn<() => void>(),
    clearWatch: vi.fn<() => void>()
  }
});

// IntersectionObserverのモック
(globalThis as any).IntersectionObserver = vi.fn<() => void>(function IntersectionObserver() {
  return {
    observe: vi.fn<() => void>(),
    unobserve: vi.fn<() => void>(),
    disconnect: vi.fn<() => void>()
  };
});

// MutationObserverのモック
(globalThis as any).MutationObserver = vi.fn<() => void>(function MutationObserver() {
  return {
    observe: vi.fn<() => void>(),
    disconnect: vi.fn<() => void>(),
    takeRecords: vi.fn<() => void>()
  };
});

// Blobのモック
(globalThis as any).Blob = vi.fn<(parts?: BlobPart[], properties?: BlobPropertyBag) => Blob>(
  function Blob(parts?: BlobPart[], properties?: BlobPropertyBag) {
    return {
      size: parts?.reduce((acc: number, part: BlobPart) => acc + (part as string).length, 0) ?? 0,
      type: properties?.type ?? '',
      parts,
      properties
    } as unknown as Blob;
  }
);

// FileReaderのモック
(globalThis as any).FileReader = vi.fn<() => void>(function FileReader() {
  return {
    readAsText: vi.fn<() => void>(),
    readAsDataURL: vi.fn<() => void>(),
    onload: null,
    onerror: null,
    result: null
  };
});

// requestAnimationFrameのモック
(globalThis as any).requestAnimationFrame = vi.fn<(cb: FrameRequestCallback) => number>(cb =>
  setTimeout(cb, 0)
);
(globalThis as any).cancelAnimationFrame = vi.fn<(id: number) => void>(id => clearTimeout(id));
/* eslint-enable @typescript-eslint/no-explicit-any -- Canvas mock requires dynamic typing for OpenLayers compatibility */

export default {};
