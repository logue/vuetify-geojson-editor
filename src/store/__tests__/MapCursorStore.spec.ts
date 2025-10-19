import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';

import useMapCursorStore from '../MapCursorStore';

import type { Coordinate } from 'ol/coordinate';

describe('MapCursorStore', () => {
  beforeEach(() => {
    // 各テストの前に新しいPiniaインスタンスを作成
    setActivePinia(createPinia());
  });

  it('should initialize with default values', () => {
    const mapCursorStore = useMapCursorStore();

    expect(mapCursorStore.coordinate).toEqual([0, 0]);
    expect(mapCursorStore.zoom).toBe(1);
    expect(mapCursorStore.level).toBe(0);
  });

  it('should set coordinate', () => {
    const mapCursorStore = useMapCursorStore();
    const newCoordinate: Coordinate = [139.766667, 35.681111]; // 東京の座標

    mapCursorStore.setCoordinate(newCoordinate);
    expect(mapCursorStore.coordinate).toEqual(newCoordinate);
  });

  it('should set zoom level', () => {
    const mapCursorStore = useMapCursorStore();

    mapCursorStore.setZoom(10);
    expect(mapCursorStore.zoom).toBe(10);

    mapCursorStore.setZoom(5);
    expect(mapCursorStore.zoom).toBe(5);
  });

  it('should set layer level', () => {
    const mapCursorStore = useMapCursorStore();

    mapCursorStore.setLevel(2);
    expect(mapCursorStore.level).toBe(2);

    mapCursorStore.setLevel(0);
    expect(mapCursorStore.level).toBe(0);
  });

  it('should handle multiple operations', () => {
    const mapCursorStore = useMapCursorStore();

    // 複数の操作を順番に実行
    const coordinate: Coordinate = [140.123456, 36.789012];
    mapCursorStore.setCoordinate(coordinate);
    mapCursorStore.setZoom(15);
    mapCursorStore.setLevel(3);

    expect(mapCursorStore.coordinate).toEqual(coordinate);
    expect(mapCursorStore.zoom).toBe(15);
    expect(mapCursorStore.level).toBe(3);
  });

  it('should handle coordinate updates correctly', () => {
    const mapCursorStore = useMapCursorStore();

    const coord1: Coordinate = [135, 35];
    const coord2: Coordinate = [140, 40];

    mapCursorStore.setCoordinate(coord1);
    expect(mapCursorStore.coordinate).toEqual(coord1);

    mapCursorStore.setCoordinate(coord2);
    expect(mapCursorStore.coordinate).toEqual(coord2);
  });

  it('should handle edge cases for zoom values', () => {
    const mapCursorStore = useMapCursorStore();

    // 最小ズーム
    mapCursorStore.setZoom(0);
    expect(mapCursorStore.zoom).toBe(0);

    // 最大ズーム
    mapCursorStore.setZoom(20);
    expect(mapCursorStore.zoom).toBe(20);

    // 小数点ズーム
    mapCursorStore.setZoom(12.5);
    expect(mapCursorStore.zoom).toBe(12.5);
  });

  it('should handle negative coordinates', () => {
    const mapCursorStore = useMapCursorStore();
    const negativeCoordinate: Coordinate = [-74.006, 40.7128]; // ニューヨークの座標

    mapCursorStore.setCoordinate(negativeCoordinate);
    expect(mapCursorStore.coordinate).toEqual(negativeCoordinate);
  });
});
