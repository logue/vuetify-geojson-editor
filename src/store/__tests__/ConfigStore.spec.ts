import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import useConfigStore from '../ConfigStore';

// window.matchMediaのモック
const mockMatchMedia = vi.fn<() => MediaQueryList>();
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
});

describe('ConfigStore', () => {
  beforeEach(() => {
    // 各テストの前に新しいPiniaインスタンスを作成
    setActivePinia(createPinia());

    // matchMediaのデフォルトモック
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>()
    });
  });

  it('should initialize with system preference (light mode)', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>()
    });

    const configStore = useConfigStore();
    expect(configStore.theme).toBe(false);
  });

  it('should initialize with system preference (dark mode)', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>()
    });

    const configStore = useConfigStore();
    expect(configStore.theme).toBe(true);
  });

  it('should toggle theme', () => {
    const configStore = useConfigStore();

    const initialTheme = configStore.theme;
    configStore.toggleTheme();
    expect(configStore.theme).toBe(!initialTheme);

    configStore.toggleTheme();
    expect(configStore.theme).toBe(initialTheme);
  });

  it('should toggle theme multiple times', () => {
    const configStore = useConfigStore();

    expect(configStore.theme).toBe(false); // 初期値（light mode）

    configStore.toggleTheme();
    expect(configStore.theme).toBe(true);

    configStore.toggleTheme();
    expect(configStore.theme).toBe(false);

    configStore.toggleTheme();
    expect(configStore.theme).toBe(true);
  });
});
