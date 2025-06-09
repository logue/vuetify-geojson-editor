import { defineStore } from 'pinia';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

import cleanCoords from '@turf/clean-coords';
import rewind from '@turf/rewind';
// import { parse } from 'geojson-precision-ts';
import { Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { topology } from 'topojson-server';
import { v4 } from 'uuid';

import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { Topology } from 'topojson-specification';

import { DefaultProperties } from '@/interfaces/FeatureProperties';

/** GeoJsonEditor Store */
export default defineStore(
  'geojson-editor',
  () => {
    /** GeoJsonからフィーチャーを取得 */
    const features: ComputedRef<Feature[]> = computed(() =>
      new GeoJSON().readFeatures(geojson.value, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    );

    /** Raw Geojson Object */
    const geojson: Ref<GeoJSONObject> = ref({
      type: 'FeatureCollection',
      features: []
    });
    const topojson: ComputedRef<Topology> = computed(() => topology({ data: geojson.value }));
    /** Request Update Flag */
    const requestRefresh: Ref<boolean> = ref(true);

    /** GeoJsonからフィーチャーを書き込む */
    function setFeatures(features: Feature[]) {
      // カウンタ
      let count = 0;
      // 番号振り直し
      features.forEach((f: Feature) => {
        count++;
        // 各ピンにUUIDとプロパティを入れる
        if (!f.getId()) {
          // IDがない場合補完
          f.setId(v4());
        }

        /** プロパティ */
        let p = f.getProperties();
        if (!p) {
          // プロパティがない場合デフォルト値を入れておく
          p = DefaultProperties;
          p.no = count;
        }
        f.setProperties(p);
      });
      geojson.value = JSON.parse(
        new GeoJSON().writeFeatures(features, {
          // GeoJSON側の座標系
          dataProjection: 'EPSG:4326',
          // 地図表示用（Web Mercator）
          featureProjection: 'EPSG:3857'
        })
      );
    }

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
        geojson.value.features.forEach((feature: any) => {
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
      features,
      geojson,
      topojson,
      requestRefresh,
      exportBlob,
      setGeoJson,
      setFeatures,
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
