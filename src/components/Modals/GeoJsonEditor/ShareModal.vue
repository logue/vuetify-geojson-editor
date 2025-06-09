<script setup lang="ts">
/** 共有モーダル */
import { useGlobalStore, useGeoJsonEditorStore, useMapCursorStore } from '@/store';
import { computed, nextTick, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue';
import { useRouter } from 'vue-router';

//@ts-ignore
import JsonUrl from 'json-url';
// import { createWriteStream } from 'streamsaver';

import type { Coordinate } from 'ol/coordinate';

/** Vue Router */
const router = useRouter();

/** グローバルストア */
const globalStore = useGlobalStore();
/** マップカーソルストア */
const mapCursorStore = useMapCursorStore();
/** GeoJSONエディタストア */
const geoJsonEditorStore = useGeoJsonEditorStore();

/** loading overlay visibility */
const loading: WritableComputedRef<boolean> = computed({
  get: () => globalStore.loading,
  set: v => globalStore.setLoading(v)
});

/** モーダルの表示制御 */
const modal: Ref<boolean> = ref(false);
/** マップ */
const share: Ref<string> = ref('base');
/** 共有座標 */
const coordinate: ComputedRef<Coordinate> = computed(() => mapCursorStore.coordinate);
/** 共有ズーム */
const zoom: ComputedRef<number> = computed(() => mapCursorStore.zoom);
/** 共有レイヤー */
const level: ComputedRef<number> = computed(() => mapCursorStore.level);

/** モーダルを開く */
const show = () => (modal.value = true);

/** モーダルを閉じる */
const hide = () => (modal.value = false);

/** クリップボードに保存 */
const copy = async () => {
  loading.value = true;
  await nextTick();
  const codec = JsonUrl('lzma');
  codec.compress(geoJsonEditorStore.topojson).then(async (json: string) => {
    /** 発行するクエリ */
    const query: Record<string, string> = {
      x: coordinate.value[1].toString(),
      y: coordinate.value[0].toString(),
      zoom: zoom.value.toString(),
      level: level.value.toString(),
      t: json
    };

    /** パス */
    const path = router.resolve({
      name: share.value,
      query
    });

    await navigator.clipboard.writeText(location.origin + path.href);
    globalStore.setMessage('Copied to clipboard');
  });

  loading.value = false;
  await nextTick();
  modal.value = false;
};

defineExpose({ show, hide });
</script>

<template>
  <v-dialog v-model="modal" max-width="640px" @keydown.esc="hide">
    <v-card title="Share" subtitle="Save the displayed markers and polygons as a URL.">
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-text>
        <v-alert density="compact" icon="mdi-alert" type="warning" class="mb-0 mt-1">
          No third party can retrieve data from this shared URL and edit the coordinate information.
          If you want to collaborate, select "Save as file" and share the generated file.
        </v-alert>
        <v-input
          label="Center"
          hint="The coordinates of the pin displayed by right-clicking will be the center."
          persistent-hint
        >
          <v-row>
            <v-col>
              <v-text-field
                v-model="coordinate[0]"
                prepend-icon="mdi-arrow-up-down"
                type="number"
                step="-90"
                min="90"
                max="6144"
                label="Latitude (Y-axis)"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="coordinate[1]"
                prepend-icon="mdi-arrow-left-right"
                type="number"
                step="1"
                min="-180"
                max="180"
                label="Longitude (X-axis)"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="zoom"
                prepend-icon="mdi-magnify"
                type="number"
                step="1"
                min="0"
                max="6"
                label="Zoom"
              />
            </v-col>
          </v-row>
        </v-input>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" prepend-icon="mdi-cancel" @click="hide">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="text" prepend-icon="mdi-clipboard-arrow-down" @click="copy">
          Share
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
