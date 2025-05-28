<script setup lang="ts">
/** 座標データインポートモーダル */
import { useGlobal, useGeoJsonEditor } from '@/store';
import { computed, nextTick, ref, type Ref, type WritableComputedRef } from 'vue';

import rewind from '@turf/rewind';
import { feature } from 'topojson-client';
import { v4 as uuidv4 } from 'uuid';

import type { Feature, FeatureCollection } from 'geojson';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { Topology } from 'topojson-specification';

const emits = defineEmits(['loaded']);

/** グローバルストア */
const globalStore = useGlobal();
/** GeoJSONエディタストア */
const geoJsonEditorStore = useGeoJsonEditor();

/** loading overlay visibility */
const loading: WritableComputedRef<boolean> = computed({
  get: () => globalStore.loading,
  set: v => globalStore.setLoading(v)
});

/** progress percentage */
const progress: WritableComputedRef<number | null> = computed({
  get: () => globalStore.progress,
  set: v => globalStore.setProgress(v)
});

/** ファイル */
const file: Ref<File | undefined> = ref();
/** エラーか */
const error: Ref<boolean> = ref(false);
/** エラーメッセージ */
const errors: Ref<string[]> = ref([]);

/** 並べ替え */
const isRewind: Ref<boolean> = ref(false);

/** ファイルリーダー */
const reader = new FileReader();
reader.onloadstart = e => {
  loading.value = true;
  if (e.lengthComputable) {
    progress.value = Math.round((e.loaded / e.total) * 100);
  }
};
reader.onloadend = () => {
  progress.value = 100;
  loading.value = false;
};

/** モーダルの表示制御 */
const modal: Ref<boolean> = ref(false);

/** モーダルを開く */
const show = () => (modal.value = true);
/** モーダルを閉じる */
const hide = () => (modal.value = false);

/** ロード */
const load = async () => {
  /** ローカルのGeoJSONを読み込む */
  loading.value = true;
  error.value = false;
  if (!file.value) {
    return;
  }
  /** ファイル読み込み */
  const reader = new FileReader();
  reader.readAsText(file.value);
  reader.onload = async () => {
    /** 入力データ */
    const ret = reader.result as string;
    /** Jsonパース */
    let json: GeoJSONObject | Topology;
    try {
      json = JSON.parse(ret);
    } catch (_e) {
      error.value = true;
      errors.value = ['GeoJson parse error.'];
      return;
    }

    if (json.type === 'Topology') {
      // TopoJsonだった場合GeoJsonに変換
      try {
        json = feature(json, 'data');
      } catch (_e) {
        error.value = true;
        errors.value = ['Topojson parse error.'];
        loading.value = false;
        return;
      }
    }

    if (isRewind.value) {
      json = rewind(json) as FeatureCollection;
    }

    if (json.type === 'FeatureCollection') {
      // UUIDを付与
      json.features.forEach((feature: Feature) => {
        feature.id = uuidv4();
        return feature;
      });
    }

    geoJsonEditorStore.setGeoJson(json);
    geoJsonEditorStore.setRefresh(true);
    error.value = false;
    file.value = undefined;
    loading.value = false;
    emits('loaded');
    await nextTick();
    hide();
    globalStore.setMessage('GeoJson loaded successfully.');
  };
};

defineExpose({ show, hide });
</script>

<template>
  <v-dialog v-model="modal" max-width="480px" @keydown.esc="hide">
    <v-card>
      <template #title>Import</template>
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-subtitle>Import a local GeoJSON / TopoJSON file.</v-card-subtitle>
      <v-card-text>
        <v-file-input
          v-model="file"
          show-size
          required
          placeholder="Choose a GeoJSON file."
          label="GeoJson"
          prepend-icon="mdi-paperclip"
          accept="application/geo+json"
          @emptied="file = undefined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" prepend-icon="mdi-cancel" variant="text" @click="hide">
          Cancel
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-check" variant="text" @click="load">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
