import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

import type { FeatureCollection } from 'geojson';

import axios from '@/plugins/axios';

/** ロケーションマーカーストア */
export default defineStore(
  'map-location-marker',
  () => {
    const geojson: Ref<FeatureCollection> = ref({
      type: 'FeatureCollection',
      features: []
    });
    const lastModified: Date | undefined = undefined;

    /**
     * ロケーションとセクションのプロパティをセット
     */
    async function init(filename: string) {
      if (geojson.value.features.length !== 0) {
        return;
      }
      const locations = await axios.get(`${import.meta.env.BASE_URL}data/${filename}.geojson`);
      geojson.value = locations.data;
    }
    /**
     * クリア
     */
    function clear() {
      geojson.value = {
        type: 'FeatureCollection',
        features: []
      };
    }
    return { geojson, lastModified, init, clear };
  },
  {
    // Data persistence destination
    persist: {
      key: 'map-location-marker',
      storage: window.localStorage
    }
  }
);
