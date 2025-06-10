<script lang="ts" setup>
import { useGeoJsonEditorStore } from '@/store';
import {
  computed,
  toRefs,
  ref,
  watch,
  type PropType,
  type Ref,
  type WritableComputedRef
} from 'vue';

import type { Feature, Map } from 'ol';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';

import ConfirmModal from '@/components/Modals/ConfirmModal.vue';
import PropertiesEditorModal from '@/components/Modals/GeoJsonEditor/PropertiesEditorModal.vue';
import SourceModal from '@/components/Modals/GeoJsonEditor/SourceModal.vue';
import useGeoJsonEditor from '@/composables/useGeoJsonEditor';

const props = defineProps({
  /** Openlayersのマップオブジェクト */
  map: {
    type: Object as PropType<Map>,
    required: true
  },
  /** 編集対象のレイヤー */
  layer: {
    type: Object as PropType<VectorLayer<VectorSource>>,
    required: true
  }
});

// propsをリアクティブなRefに変換
const { map, layer } = toRefs(props);

/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditorStore();

/** フィーチャー */
const features: WritableComputedRef<Feature[]> = computed({
  get: () => geoJsonEditorStore.features,
  set: feats => geoJsonEditorStore.setFeatures(feats)
});

/** GeoJsonソースモーダル */
const codeModal: Ref<InstanceType<typeof SourceModal> | undefined> = ref();

/** 確認モーダル */
const confirmModal: Ref<InstanceType<typeof ConfirmModal> | undefined> = ref();

/** プロパティ編集モーダル */
const propertiesModal: Ref<InstanceType<typeof PropertiesEditorModal> | undefined> = ref();

// --- Composableの利用 ---
// Composableに必要なリアクティブな値を渡す
const {
  selectedTool, // Composableから受け取る選択中のツール
  isSnapEnabled, // Composableから受け取るスナップの状態
  featureToEdit, // Composableから受け取る編集対象のFeature
  undo, // Undoメソッド
  redo, // Redoメソッド
  toggleSnap, // スナップ切り替えメソッド
  clearAllFeatures, // 全削除メソッド
  redrawFeatures, // 再描画メソッド
  updateFeature, // 更新メソッド
  deleteFeature, // 削除メソッド
  unSelectFeature // 選択解除メソッド
} = useGeoJsonEditor({
  map,
  layer
});

// --- Component-specific Logic ---

// Composableから渡された編集対象のFeatureを監視し、モーダルを開く
watch(featureToEdit, feature => {
  if (feature) {
    propertiesModal.value?.show(feature);
  }
});

/** ソースモーダルを表示 */
const showSource = () => {
  // ソース表示の準備はストアの更新に任せる
  features.value = props.layer.getSource()!.getFeatures();
  codeModal.value?.show();
};

/** フィーチャーを全削除する */
const clear = () => {
  geoJsonEditorStore.clear(); // Piniaストアをクリア
  clearAllFeatures(); // Composableのメソッドを呼ぶ
};
</script>

<template>
  <!-- ツールバー -->
  <v-toolbar color="primary" dense elevation="2">
    <v-btn-toggle v-model="selectedTool" class="px-0" variant="text" theme="dark">
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-cursor-default" tile value="default" v-bind="slotProps" />
        </template>
        Default
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-arrow-all" tile value="translate" v-bind="slotProps" />
        </template>
        Translate
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-point-select" tile value="edit" v-bind="slotProps" />
        </template>
        Edit Properties
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-polyline-edit" tile value="modify" v-bind="slotProps" />
        </template>
        Modify (Alt + Click to delete point.)
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-square-edit" tile value="transform" v-bind="slotProps" />
        </template>
        Rotate / Scale / Move
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-square-remove" tile value="delete" v-bind="slotProps" />
        </template>
        Delete
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-point-plus" tile value="point" v-bind="slotProps" />
        </template>
        Point
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-line" tile value="line" v-bind="slotProps" />
        </template>
        Line
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-polygon" tile value="polygon" v-bind="slotProps" />
        </template>
        Polygon
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-difference" tile value="hole" v-bind="slotProps" />
        </template>
        Draw Hole
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-square" tile value="square" v-bind="slotProps" />
        </template>
        Square
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-vector-circle" tile value="circle" v-bind="slotProps" />
        </template>
        Circle
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props: slotProps }">
          <v-btn icon="mdi-format-color-fill" tile value="fill" v-bind="slotProps" />
        </template>
        Fill
      </v-tooltip>
    </v-btn-toggle>
    <v-divider vertical />
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn
          :icon="`mdi-grid${isSnapEnabled ? '' : '-off'}`"
          tile
          v-bind="slotProps"
          @click="toggleSnap"
        />
      </template>
      Snap
    </v-tooltip>
    <v-divider vertical />
    <v-spacer />
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn icon="mdi-undo" tile v-bind="slotProps" @click="undo()" />
      </template>
      Undo
    </v-tooltip>
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn icon="mdi-redo" tile v-bind="slotProps" @click="redo()" />
      </template>
      Redo
    </v-tooltip>
    <v-divider vertical />
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn icon="mdi-delete" tile v-bind="slotProps" @click="confirmModal?.show()" />
      </template>
      Clear
    </v-tooltip>
    <v-divider vertical />
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn icon="mdi-code-json" tile v-bind="slotProps" @click="showSource" />
      </template>
      Geojson Source
    </v-tooltip>
  </v-toolbar>
  <!-- 削除確認モーダル -->
  <confirm-modal
    ref="confirmModal"
    danger
    message="Are you sure you want to remove all features?"
    title="Clear"
    @submit="clear"
  />
  <!-- 詳細編集 -->
  <properties-editor-modal
    ref="propertiesModal"
    @cancel="unSelectFeature"
    @delete="deleteFeature"
    @submit="updateFeature"
  />
  <!-- GeoJson Editor-->
  <source-modal ref="codeModal" @close="redrawFeatures" />
</template>
