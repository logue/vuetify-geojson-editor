import { defineStore } from 'pinia';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

import cleanCoords from '@turf/clean-coords';
import rewind from '@turf/rewind';
// import { parse } from 'geojson-precision-ts';
import { topology } from 'topojson-server';

import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { Topology } from 'topojson-specification';

/** GeoJsonEditor Store */
export default defineStore(
  'geojson-editor',
  () => {
    /** Raw Geojson Object */
    const geojson: Ref<GeoJSONObject> = ref({
      type: 'FeatureCollection',
      features: []
    });
    const topojson: ComputedRef<Topology> = computed(() => topology({ data: geojson.value }));
    /** Request Update Flag */
    const requestRefresh: Ref<boolean> = ref(true);

    /**
     * @param type - ファイル形式
     * @param format - 整形するか
     * @param clean - 重複する座標を削除するか
     */
    function exportBlob(
      type: 'geojson' | 'topojson' = 'geojson',
      format = false,
      clean = false
    ): Blob {
      // IDを削除
      if (geojson.value.type === 'FeatureCollection') {
        geojson.value.features.forEach(feature => {
          delete feature.id;
          return feature;
        });
      }

      // 最適化
      let data = rewind(geojson.value);

      // 重複を削除
      if (clean) {
        data = cleanCoords(data);
      }

      /** 出力データ */
      const stream = JSON.stringify(
        type === 'topojson'
          ? {
              // TopoJsonのスキーマーヘッダを挿入
              ...{
                $schema:
                  'https://raw.githubusercontent.com/Casyfill/TopoJSON_schema/master/topology.json'
              },
              ...topology({ data })
            }
          : {
              // GeoJsonのスキーマーヘッダを挿入
              ...{ $schema: 'https://json.schemastore.org/geojson.json' },
              ...data
            },
        null,
        // フォーマットする場合はスペース2個分
        format ? 2 : 0
      );

      return new Blob([stream], {
        type: 'application/geo+json'
      });
    }

    /**
     * GeoJsonを保存する
     *
     * @param source - GeoJSONデータ
     */
    function setGeoJson(source: GeoJSONObject) {
      geojson.value = source;
    }
    /**
     * 初期化
     */
    function clear() {
      geojson.value = {
        type: 'FeatureCollection',
        features: []
      };
      requestRefresh.value = true;
    }
    /**
     * 更新要求フラグをセット
     *
     * @param flag - 更新フラグ
     */
    function setRefresh(flag = true) {
      requestRefresh.value = flag;
    }

    return {
      geojson,
      topojson,
      requestRefresh,
      exportBlob,
      setGeoJson,
      clear,
      setRefresh
    };
  },
  {
    persist: {
      storage: window.localStorage
    }
  }
);
