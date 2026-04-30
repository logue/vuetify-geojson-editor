/* eslint-disable @typescript-eslint/no-explicit-any -- OpenLayers mock objects require dynamic typing */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getGeoJson,
  setFeaturesStyle,
  setFeaturesVisibility,
  getFeatureStyle,
  pinStyle
} from '../FeatureUtility';

import type { FeatureCollection } from 'geojson';

function createMockStyle() {
  return {
    getImage: vi.fn<() => void>(() => ({
      setScale: vi.fn<() => void>(),
      setOpacity: vi.fn<() => void>()
    })),
    getText: vi.fn<() => void>(() => ({
      setText: vi.fn<() => void>(),
      setFont: vi.fn<() => void>()
    })),
    getStroke: vi.fn<() => void>(() => ({
      setWidth: vi.fn<() => void>()
    })),
    getFill: vi.fn<() => void>(() => ({
      getColor: vi.fn<() => string>(() => '#ff0000'),
      setColor: vi.fn<() => void>()
    }))
  };
}

// ストアのモック
vi.mock('@/store', () => ({
  useGlobalStore: vi.fn<() => any>(() => ({
    setMessage: vi.fn<() => void>()
  }))
}));

// OpenLayersのモック
vi.mock('ol/layer/Vector', () => ({
  Vector: vi.fn<() => void>()
}));

vi.mock('ol/source/Vector', () => ({
  Vector: vi.fn<() => void>()
}));

vi.mock('ol/style', () => ({
  Icon: vi.fn<() => void>(function Icon() {
    return {};
  }),
  Style: vi.fn<() => void>(function Style() {
    return createMockStyle();
  })
}));

// FeatureStylesのモック
vi.mock('@/helpers/FeatureStyles', () => ({
  default: {
    getIconStyle: vi.fn<() => any>(() => createMockStyle()),
    getSectionPolygonStyle: vi.fn<() => any>(() => createMockStyle()),
    getStyle: vi.fn<() => any>(() => createMockStyle()),
    fontFace: 'Arial'
  }
}));

// FeatureStatusのモック
vi.mock('@/helpers/FeatureStyles/FeatureStatus', () => ({
  default: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SELECTED: 'selected',
    HOVER: 'hover'
  }
}));

describe('FeatureUtility', () => {
  const createMockFeature = (properties: any, geometryType = 'Point') => ({
    getProperties: vi.fn<() => any>(() => properties),
    getGeometry: vi.fn<() => any>(() => ({
      getType: vi.fn<() => string>(() => geometryType)
    }))
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('getGeoJson', () => {
    it('should fetch GeoJSON data successfully', async () => {
      const mockData: FeatureCollection = {
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

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn<() => Promise<FeatureCollection>>().mockResolvedValue(mockData)
      });

      const result = await getGeoJson('test');
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/data/test.geojson');
    });

    it('should return null on error', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await getGeoJson('test');
      expect(result).toBeNull();
    });
  });

  describe('pinStyle', () => {
    it('should be defined as a Style instance', () => {
      expect(pinStyle).toBeDefined();
    });
  });

  describe('setFeaturesStyle', () => {
    it('should return early if vectorLayer is undefined', () => {
      expect(() => setFeaturesStyle(undefined)).not.toThrow();
    });

    it('should set style on vector layer', () => {
      const mockVectorLayer = {
        setStyle: vi.fn<() => void>(),
        getProperties: vi.fn<() => any>(() => ({ id: 'test-layer' }))
      };

      setFeaturesStyle(mockVectorLayer as any, 0, 10);
      expect(mockVectorLayer.setStyle).toHaveBeenCalled();
    });
  });

  describe('setFeaturesVisibility', () => {
    it('should return early if vectorLayer is undefined', () => {
      expect(() => setFeaturesVisibility(undefined, 0, [])).not.toThrow();
    });

    it('should set style on vector layer for visibility control', () => {
      const mockVectorLayer = {
        setStyle: vi.fn<() => void>(),
        getProperties: vi.fn<() => any>(() => ({ id: 'test-layer' }))
      };

      setFeaturesVisibility(mockVectorLayer as any, 0, ['marker']);
      expect(mockVectorLayer.setStyle).toHaveBeenCalled();
    });
  });

  describe('getFeatureStyle', () => {
    it('should return style for feature with icon', () => {
      const mockFeature = createMockFeature({
        icon: 'test-icon',
        color: '#ff0000',
        annotation: 'Test annotation'
      });

      const result = getFeatureStyle(mockFeature as any);
      expect(result).toBeDefined();
    });

    it('should return style for feature without icon', () => {
      const mockFeature = createMockFeature({
        color: '#ff0000'
      });

      const result = getFeatureStyle(mockFeature as any, 'active');
      expect(result).toBeDefined();
    });

    it('should return section polygon style for polygon features', () => {
      const mockFeature = createMockFeature(
        {
          color: '#ff0000'
        },
        'Polygon'
      );

      const result = getFeatureStyle(mockFeature as any, 'active', 'sectionLayer');
      expect(result).toBeDefined();
    });

    it('should handle annotation for point features', () => {
      const mockFeature = createMockFeature({
        color: '#ff0000',
        annotation: 'test annotation'
      });

      const result = getFeatureStyle(mockFeature as any);
      expect(result).toBeDefined();
    });

    it('should handle thickness property', () => {
      const mockFeature = createMockFeature(
        {
          color: '#ff0000',
          thickness: 5
        },
        'LineString'
      );

      const result = getFeatureStyle(mockFeature as any);
      expect(result).toBeDefined();
    });

    it('should handle opacity property', () => {
      const mockFeature = createMockFeature(
        {
          color: '#ff0000',
          opacity: 0.5
        },
        'Polygon'
      );

      const result = getFeatureStyle(mockFeature as any);
      expect(result).toBeDefined();
    });

    it('should handle annotation style property', () => {
      const mockFeature = createMockFeature({
        color: '#ff0000',
        annotation: 'test',
        annotationStyle: 'bold 14px'
      });

      const result = getFeatureStyle(mockFeature as any);
      expect(result).toBeDefined();
    });
  });
});

/* eslint-enable @typescript-eslint/no-explicit-any -- OpenLayers mock objects require dynamic typing */
