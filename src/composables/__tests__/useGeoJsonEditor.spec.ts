/* eslint-disable @typescript-eslint/no-explicit-any */
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

import useGeoJsonEditor from '../useGeoJsonEditor';

// OpenLayersのモック
const mockMap = {
  addInteraction: vi.fn(),
  removeInteraction: vi.fn(),
  getInteractions: vi.fn(() => ({
    getArray: vi.fn(() => [])
  }))
};

const mockLayer = {
  getSource: vi.fn(() => ({
    clear: vi.fn(),
    addFeatures: vi.fn(),
    removeFeature: vi.fn(),
    getFeatures: vi.fn(() => []),
    getFeatureById: vi.fn()
  }))
};

// OpenLayersのインタラクションクラスをモック
vi.mock('ol/interaction', () => ({
  Draw: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  })),
  Modify: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  })),
  Translate: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  })),
  Select: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    getFeatures: vi.fn(() => ({
      clear: vi.fn(),
      getArray: vi.fn(() => [])
    })),
    setActive: vi.fn()
  })),
  Snap: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/Delete', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/DrawHole', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn(),
    getPolygon: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/DrawRegular', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/FillAttribute', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/Transform', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    setActive: vi.fn(),
    setCenter: vi.fn()
  }))
}));

vi.mock('ol-ext/interaction/UndoRedo', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn()
  }))
}));

// ストアのモック
vi.mock('@/store', () => ({
  useGeoJsonEditorStore: vi.fn(() => ({
    features: [],
    setFeatures: vi.fn(),
    setRefresh: vi.fn(),
    clear: vi.fn()
  }))
}));

describe('useGeoJsonEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    expect(composable.selectedTool.value).toBe('default');
    expect(composable.isSnapEnabled.value).toBe(false);
    expect(composable.featureToEdit.value).toBeUndefined();
  });

  it('should provide undo/redo functions', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    expect(typeof composable.undo).toBe('function');
    expect(typeof composable.redo).toBe('function');
  });

  it('should provide toggle snap function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    const initialSnap = composable.isSnapEnabled.value;
    composable.toggleSnap();
    expect(composable.isSnapEnabled.value).toBe(!initialSnap);
  });

  it('should provide clear all features function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    expect(typeof composable.clearAllFeatures).toBe('function');
    composable.clearAllFeatures();
  });

  it('should provide redraw features function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    expect(typeof composable.redrawFeatures).toBe('function');
    composable.redrawFeatures();
    expect(mockLayer.getSource().clear).toHaveBeenCalled();
  });

  it('should provide update feature function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    const mockFeature = {
      getId: vi.fn(() => 'test-id'),
      getProperties: vi.fn(() => ({})),
      setProperties: vi.fn()
    };

    expect(typeof composable.updateFeature).toBe('function');
    composable.updateFeature(mockFeature as any);
  });

  it('should provide delete feature function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    const mockFeature = {
      getId: vi.fn(() => 'test-id'),
      getProperties: vi.fn(() => ({}))
    };

    expect(typeof composable.deleteFeature).toBe('function');
    composable.deleteFeature(mockFeature as any);
  });

  it('should provide unselect feature function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    expect(typeof composable.unSelectFeature).toBe('function');
    composable.unSelectFeature();
  });

  it('should add interactions to map when map is provided', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    // マップにインタラクションが追加されることを確認
    expect(mockMap.addInteraction).toHaveBeenCalled();
  });

  it('should change selected tool', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    composable.selectedTool.value = 'point';
    expect(composable.selectedTool.value).toBe('point');

    composable.selectedTool.value = 'polygon';
    expect(composable.selectedTool.value).toBe('polygon');
  });
});
