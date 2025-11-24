<script setup lang="ts">
import { toRef, type PropType } from 'vue';

import type Map from 'ol/Map';

import { useMapContextMenu } from '@/composables/useMapContextMenu';

/** MapContextMenu */
/** プロップ */
const props = defineProps({
  /** マップ */
  map: { type: Object as PropType<Map | undefined>, default: undefined }
});

/** マップのリアクティブ参照 */
const mapRef = toRef(props, 'map');

/** コンテキストメニュー機能 */
const { visibility, position, coordinate, zoom, copyLink, toImage, show, hide } =
  useMapContextMenu(mapRef);

defineExpose({ show, hide, position, coordinate });
</script>

<template>
  <v-menu v-model="visibility" absolute :style="`top: ${position.y}px; left: ${position.x}px`">
    <v-list density="compact">
      <!-- 座標やズーム値 -->
      <v-list-subheader>
        <v-icon size="small">mdi-crosshairs</v-icon>
        Coordinate
        <v-icon size="small">mdi-arrow-left-right</v-icon>
        {{ coordinate[0]!.toFixed(6) }},
        <v-icon size="small">mdi-arrow-up-down</v-icon>
        {{ coordinate[1]!.toFixed(6) }}
        &nbsp;
        <v-icon size="small">mdi-magnify</v-icon>
        Zoom: {{ Math.round(zoom) }}
      </v-list-subheader>
      <!-- メニュー項目 -->
      <v-list-item
        prepend-icon="mdi-link-variant"
        title="Copy link to the clipboard"
        @click="copyLink"
      />
      <v-divider />
      <v-list-item
        prepend-icon="mdi-image-marker"
        title="Copy the map image to the clipboard"
        @click="toImage(false)"
      />
      <v-list-item
        prepend-icon="mdi-file-image-marker"
        title="Save map image to file"
        @click="toImage(true)"
      />
    </v-list>
  </v-menu>
</template>
