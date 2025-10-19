import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';

import useGlobalStore from '../GlobalStore';

describe('GlobalStore', () => {
  beforeEach(() => {
    // 各テストの前に新しいPiniaインスタンスを作成
    setActivePinia(createPinia());
  });

  it('should initialize with default values', () => {
    const globalStore = useGlobalStore();

    expect(globalStore.loading).toBe(true);
    expect(globalStore.progress).toBeNull();
    expect(globalStore.message).toBe('');
  });

  it('should set loading state', () => {
    const globalStore = useGlobalStore();

    globalStore.setLoading(false);
    expect(globalStore.loading).toBe(false);
    expect(globalStore.progress).toBeNull();

    globalStore.setLoading(true);
    expect(globalStore.loading).toBe(true);
  });

  it('should reset progress when loading is set to false', () => {
    const globalStore = useGlobalStore();

    globalStore.setProgress(50);
    expect(globalStore.progress).toBe(50);

    globalStore.setLoading(false);
    expect(globalStore.progress).toBeNull();
  });

  it('should set progress value and enable loading', () => {
    const globalStore = useGlobalStore();

    globalStore.setLoading(false);
    expect(globalStore.loading).toBe(false);

    globalStore.setProgress(75);
    expect(globalStore.progress).toBe(75);
    expect(globalStore.loading).toBe(true);
  });

  it('should set progress to null', () => {
    const globalStore = useGlobalStore();

    globalStore.setProgress(50);
    expect(globalStore.progress).toBe(50);

    globalStore.setProgress(null);
    expect(globalStore.progress).toBeNull();
    expect(globalStore.loading).toBe(true);
  });

  it('should set message', () => {
    const globalStore = useGlobalStore();

    globalStore.setMessage('Test message');
    expect(globalStore.message).toBe('Test message');

    globalStore.setMessage();
    expect(globalStore.message).toBe('');
  });

  it('should handle multiple operations correctly', () => {
    const globalStore = useGlobalStore();

    // 複数の操作を順番に実行
    globalStore.setMessage('Loading...');
    globalStore.setProgress(25);
    expect(globalStore.message).toBe('Loading...');
    expect(globalStore.progress).toBe(25);
    expect(globalStore.loading).toBe(true);

    globalStore.setProgress(100);
    expect(globalStore.progress).toBe(100);

    globalStore.setLoading(false);
    expect(globalStore.loading).toBe(false);
    expect(globalStore.progress).toBeNull();

    globalStore.setMessage('Completed');
    expect(globalStore.message).toBe('Completed');
  });
});
