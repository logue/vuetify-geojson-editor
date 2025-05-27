import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

import type { Coordinate } from 'ol/coordinate';

/** マップのカーソルストア */
export default defineStore('map-cursor', () => {
  /** Map Coordinate (Lat=Y, Lng=X) */
  const coordinate: Ref<Coordinate> = ref([0, 0]);
  /** Map Zoom Level */
  const zoom: Ref<number> = ref(1);
  /** Map Layer Level */
  const level: Ref<number> = ref(0);

  /**
   * Store current Location
   *
   * @param coordinate - Current coordinate
   */
  function setCoordinate(coord: Coordinate) {
    coordinate.value = coord;
  }
  /**
   * Store map zoom
   *
   * @param zoom - Current zoom
   */
  function setZoom(z: number) {
    zoom.value = z;
  }
  /**
   * Store map layer
   *
   * @param level - Current layer
   */
  function setLevel(l: number) {
    level.value = l;
  }
  return {
    level,
    zoom,
    coordinate,
    setCoordinate,
    setZoom,
    setLevel
  };
});
