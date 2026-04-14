/* eslint-disable @typescript-eslint/no-explicit-any */
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

import useGeoJsonEditor from '../useGeoJsonEditor';

// OpenLayersのモック
const mockMap = {
  addInteraction: vi.fn<() => void>(),
  removeInteraction: vi.fn<() => void>(),
  getInteractions: vi.fn<() => any>(() => ({
    getArray: vi.fn<() => any>(() => [])
  }))
};

const mockSource = {
  clear: vi.fn<() => void>(),
  addFeatures: vi.fn<() => void>(),
  removeFeature: vi.fn<() => void>(),
  getFeatures: vi.fn<() => any>(() => []),
  getFeatureById: vi.fn<() => any>()
};

const mockLayer = {
  getSource: vi.fn<() => any>(() => mockSource)
};

// OpenLayersのインタラクションクラスをモック
vi.mock('ol/interaction', () => ({
  Draw: vi.fn(function Draw() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  }),
  Modify: vi.fn(function Modify() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  }),
  Translate: vi.fn(function Translate() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  }),
  Select: vi.fn(function Select() {
    return {
      on: vi.fn<() => void>(),
      getFeatures: vi.fn<() => any>(() => ({
        clear: vi.fn<() => void>(),
        getArray: vi.fn<() => any>(() => [])
      })),
      setActive: vi.fn<() => void>()
    };
  }),
  Snap: vi.fn(function Snap() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/Delete', () => ({
  default: vi.fn(function Delete() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/DrawHole', () => ({
  default: vi.fn(function DrawHole() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>(),
      getPolygon: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/DrawRegular', () => ({
  default: vi.fn(function DrawRegular() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/FillAttribute', () => ({
  default: vi.fn(function FillAttribute() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/Transform', () => ({
  default: vi.fn(function Transform() {
    return {
      on: vi.fn<() => void>(),
      setActive: vi.fn<() => void>(),
      setCenter: vi.fn<() => void>()
    };
  })
}));

vi.mock('ol-ext/interaction/UndoRedo', () => ({
  default: vi.fn(function UndoRedo() {
    return {
      on: vi.fn<() => void>(),
      undo: vi.fn<() => void>(),
      redo: vi.fn<() => void>()
    };
  })
}));

// ストアのモック
vi.mock('@/store', () => ({
  useGeoJsonEditorStore: vi.fn<() => any>(() => ({
    features: [],
    setFeatures: vi.fn<() => void>(),
    setRefresh: vi.fn<() => void>(),
    clear: vi.fn<() => void>()
  }))
}));

describe('useGeoJsonEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSource.clear.mockClear();
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
    expect(mockSource.clear).toHaveBeenCalled();
  });

  it('should provide update feature function', () => {
    const mapRef = ref(mockMap as any);
    const layerRef = ref(mockLayer as any);

    const composable = useGeoJsonEditor({
      map: mapRef,
      layer: layerRef
    });

    const mockFeature = {
      getId: vi.fn<() => string>(() => 'test-id'),
      getProperties: vi.fn<() => any>(() => ({})),
      setProperties: vi.fn<() => void>()
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
      getId: vi.fn<() => string>(() => 'test-id'),
      getProperties: vi.fn<() => any>(() => ({}))
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
