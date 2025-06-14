<script setup lang="ts">
/** GeoJsonエディタ */
import { useGeoJsonEditorStore } from '@/store';
import { ref, type Ref } from 'vue';

import { json, jsonParseLinter } from '@codemirror/lang-json';
import CodeMirror from 'vue-codemirror6';
import { useTheme } from 'vuetify';

// コンポーネント
import ExportModal from '@/components/Modals/GeoJsonEditor/ExportModal.vue';
import ImportModal from '@/components/Modals/GeoJsonEditor/ImportModal.vue';

/** Emits */
const emits = defineEmits({ close: () => true });

const geoJsonEditorStore = useGeoJsonEditorStore();

/** vuetify */
const theme = useTheme();

/** エクスポートダイアログ */
const exportModal: Ref<InstanceType<typeof ExportModal> | undefined> = ref();
/** インポートダイアログ */
const importModal: Ref<InstanceType<typeof ImportModal> | undefined> = ref();
/** エディタ */
const editor: Ref<InstanceType<typeof CodeMirror> | undefined> = ref();

/** ダークモード */
const dark: Ref<boolean> = ref(theme.current.value.dark);

/** モーダルの表示非表示制御 */
const modal: Ref<boolean> = ref(false);

/** テキストエディタの値 */
const source: Ref<string> = ref('');

/** リンターエラーの数 */
const errorCount: Ref<number> = ref(0);

/** モーダルを開く */
const show = () => {
  modal.value = true;
  source.value = JSON.stringify(geoJsonEditorStore.geojson, null, 2);
};

/** 保存処理 */
const submit = () => {
  try {
    const j = JSON.parse(source.value);
    geoJsonEditorStore.setGeoJson(j);
  } catch (e) {
    console.warn(`⚠️${e}`, source);
    return;
  }
  geoJsonEditorStore.setRefresh(true);
  hide();
};

/** モーダルを閉じる */
const hide = () => {
  emits('close');
  modal.value = false;
};

/** GeoJsonを開くモーダル */
const showImport = () => importModal.value?.show();

/** GeoJsonを開保存モーダル */
const showExport = () => exportModal.value?.show();

/** インポート完了時にソースを上書き */
const onLoaded = () => (source.value = JSON.stringify(geoJsonEditorStore.geojson, null, 2));

defineExpose({ show });
</script>

<template>
  <v-dialog v-model="modal" fullscreen transition="dialog-bottom-transition">
    <v-card class="d-flex flex-column">
      <template #title>Source</template>
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-subtitle class="flex-grow-0" style="flex-basis: auto">Geojson source</v-card-subtitle>
      <code-mirror
        ref="editor"
        v-model="source"
        :dark="dark"
        :lang="json()"
        :linter="jsonParseLinter()"
        basic
        class="flex-grow-1"
        gutter
        style="flex-basis: 0; overflow-y: scroll"
        wrap
      />
      <v-card-actions class="flex-grow-0" style="flex-basis: auto">
        <v-btn color="orange" prepend-icon="mdi-upload" variant="text" @click="showImport">
          Import
        </v-btn>
        <v-btn
          :disabled="errorCount !== 0"
          color="green"
          prepend-icon="mdi-download"
          variant="text"
          @click="showExport"
        >
          Export
        </v-btn>
        <v-spacer />
        <v-btn color="secondary" prepend-icon="mdi-cancel" variant="text" @click="hide">
          Cancel
        </v-btn>
        <v-btn
          :disabled="editor?.diagnosticCount !== 0"
          color="primary"
          prepend-icon="mdi-check"
          variant="text"
          @click="submit"
        >
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
    <import-modal ref="importModal" @loaded="onLoaded" />
    <export-modal ref="exportModal" />
  </v-dialog>
</template>
