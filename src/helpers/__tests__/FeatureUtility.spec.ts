/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getGeoJson,
  setFeaturesStyle,
  setFeaturesVisibility,
  getFeatureStyle,
  pinStyle
} from '../FeatureUtility';

import type { FeatureCollection } from 'geojson';

// axiosのモック
vi.mock('@/plugins/axios', () => ({
  default: {
    get: vi.fn()
  }
}));

// ストアのモック
vi.mock('@/store', () => ({
  useGlobalStore: vi.fn(() => ({
    setMessage: vi.fn()
  }))
}));

// OpenLayersのモック
vi.mock('ol/layer/Vector', () => ({
  Vector: vi.fn()
}));

vi.mock('ol/source/Vector', () => ({
  Vector: vi.fn()
}));

vi.mock('ol/style', () => ({
  Icon: vi.fn(),
  Style: vi.fn().mockImplementation(() => ({
    getImage: vi.fn(() => ({
      setScale: vi.fn(),
      setOpacity: vi.fn()
    })),
    getText: vi.fn(() => ({
      setText: vi.fn(),
      setFont: vi.fn()
    })),
    getStroke: vi.fn(() => ({
      setWidth: vi.fn()
    })),
    getFill: vi.fn(() => ({
      getColor: vi.fn(() => '#ff0000'),
      setColor: vi.fn()
    }))
  }))
}));

// FeatureStylesのモック
vi.mock('@/helpers/FeatureStyles', () => ({
  default: {
    getIconStyle: vi.fn(() => new (vi.fn())()),
    getSectionPolygonStyle: vi.fn(() => new (vi.fn())()),
    getStyle: vi.fn(() => new (vi.fn())()),
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
    getProperties: vi.fn(() => properties),
    getGeometry: vi.fn(() => ({
      getType: vi.fn(() => geometryType)
    }))
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

      const axios = await import('@/plugins/axios');
      (axios.default.get as any).mockResolvedValue({ data: mockData });

      const result = await getGeoJson('test');
      expect(result).toEqual(mockData);
      expect(axios.default.get).toHaveBeenCalledWith('undefined/data/test.geojson');
    });

    it('should return null on error', async () => {
      const axios = await import('@/plugins/axios');
      (axios.default.get as any).mockRejectedValue(new Error('Network error'));

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
        setStyle: vi.fn(),
        getProperties: vi.fn(() => ({ id: 'test-layer' }))
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
        setStyle: vi.fn(),
        getProperties: vi.fn(() => ({ id: 'test-layer' }))
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
