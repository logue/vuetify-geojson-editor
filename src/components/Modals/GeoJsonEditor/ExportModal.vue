<script setup lang="ts">
/** エクスポートモーダル */
import { useGeoJsonEditorStore, useGlobalStore } from '@/store';
import { nextTick, ref, type Ref } from 'vue';

import { createWriteStream } from 'streamsaver';

/** グローバルストア */
const globalStore = useGlobalStore();
/** 設計書ストア */
const GeoJsonEditorStore = useGeoJsonEditorStore();

/** モーダルの表示制御 */
const modal: Ref<boolean> = ref(false);

/** ファイルフォーマット */
const type: Ref<'geojson' | 'topojson'> = ref('geojson');
/** 整形 */
const format: Ref<boolean> = ref(false);

/** 保存ファイル名 */
const fileName: Ref<string> = ref('export-' + new Date().toLocaleDateString());

/** モーダルを開く */
const show = () => (modal.value = true);
/** モーダルを閉じる */
const hide = () => (modal.value = false);

/** 実行 */
const exportFile = async () => {
  globalStore.setLoading(true);
  await nextTick();
  // ファイルとして保存
  const blob: Blob = GeoJsonEditorStore.exportBlob(type.value, format.value);

  const fileStream = createWriteStream(`${fileName.value}.json`, {
    size: blob.size
  });

  await new Response(blob).body?.pipeTo(fileStream);
  globalStore.setLoading(false);
  hide();
};

defineExpose({ show });
</script>

<template>
  <v-dialog v-model="modal" max-width="480px" @keydown.esc="hide">
    <v-card title="Export" subtitle="Import a local GeoJSON / TopoJSON file.">
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-text>
        <v-radio-group v-model="type" label="File Type" inline>
          <v-radio label="GeoJson" value="geojson" />
          <v-radio label="TopoJson" value="topojson" />
        </v-radio-group>
        <v-text-field
          v-model="fileName"
          prepend-icon="mdi-file-download-outline"
          label="Filename"
          :suffix="`.${type}`"
          hide-details
        />
        <v-switch v-model="format" label="Compress" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="secondary" prepend-icon="mdi-cancel" @click="hide">
          Cancel
        </v-btn>
        <v-btn variant="text" color="primary" prepend-icon="mdi-file-download" @click="exportFile">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
