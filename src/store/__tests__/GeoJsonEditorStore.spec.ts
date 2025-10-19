import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import useGeoJsonEditorStore from '../GeoJsonEditorStore';

import type { GeoJSONObject } from 'ol/format/GeoJSON';

// OpenLayersのモック
vi.mock('ol/format/GeoJSON', () => ({
  GeoJSON: vi.fn().mockImplementation(() => ({
    readFeatures: vi.fn(() => []),
    writeFeatures: vi.fn(() =>
      JSON.stringify({
        type: 'FeatureCollection',
        features: []
      })
    )
  }))
}));

vi.mock('ol', () => ({
  Feature: vi.fn().mockImplementation(() => ({
    getId: vi.fn(),
    setId: vi.fn(),
    getProperties: vi.fn(() => ({})),
    setProperties: vi.fn()
  }))
}));

describe('GeoJsonEditorStore', () => {
  beforeEach(() => {
    // 各テストの前に新しいPiniaインスタンスを作成
    setActivePinia(createPinia());
  });

  it('should initialize with default GeoJSON', () => {
    const store = useGeoJsonEditorStore();

    expect(store.geojson).toEqual({
      type: 'FeatureCollection',
      features: []
    });
    expect(store.requestRefresh).toBe(true);
  });

  it('should set GeoJSON data', () => {
    const store = useGeoJsonEditorStore();

    const testGeoJson: GeoJSONObject = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [139.766667, 35.681111]
          },
          properties: {
            name: 'Test Point'
          }
        }
      ]
    };

    store.setGeoJson(testGeoJson);
    expect(store.geojson).toEqual(testGeoJson);
  });

  it('should clear GeoJSON data', () => {
    const store = useGeoJsonEditorStore();

    // 何らかのデータを設定
    const testData: GeoJSONObject = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {}
        }
      ]
    };
    store.setGeoJson(testData);

    // クリア実行
    store.clear();

    expect(store.geojson).toEqual({
      type: 'FeatureCollection',
      features: []
    });
    expect(store.requestRefresh).toBe(true);
  });

  it('should set refresh flag', () => {
    const store = useGeoJsonEditorStore();

    store.setRefresh(false);
    expect(store.requestRefresh).toBe(false);

    store.setRefresh(true);
    expect(store.requestRefresh).toBe(true);

    store.setRefresh(); // デフォルトはtrue
    expect(store.requestRefresh).toBe(true);
  });

  it('should export blob with default settings', () => {
    const store = useGeoJsonEditorStore();

    const blob = store.exportBlob();

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/geo+json');
  });

  it('should export blob with formatting', () => {
    const store = useGeoJsonEditorStore();

    const blob = store.exportBlob('geojson', true);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/geo+json');
  });

  it('should export topojson blob', () => {
    const store = useGeoJsonEditorStore();

    const blob = store.exportBlob('topojson');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/geo+json');
  });

  it('should export blob with clean option', () => {
    const store = useGeoJsonEditorStore();

    const blob = store.exportBlob('geojson', false, true);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/geo+json');
  });

  it('should handle features computed property', () => {
    const store = useGeoJsonEditorStore();

    // featuresは計算プロパティなので、GeoJSONが変更されると自動的に更新される
    expect(store.features).toEqual([]);
  });

  it('should handle topojson computed property', () => {
    const store = useGeoJsonEditorStore();

    // topojsonは計算プロパティ
    expect(store.topojson).toBeDefined();
    expect(typeof store.topojson).toBe('object');
  });
});
