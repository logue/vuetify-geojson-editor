<script lang="ts" setup>
import { useGeoJsonEditorStore } from '@/store';
import {
  computed,
  onMounted,
  ref,
  watch,
  type PropType,
  type Ref,
  type WritableComputedRef
} from 'vue';

import MapBrowserEventType from 'ol/MapBrowserEventType';
import { Interaction, Select, Snap, type Draw } from 'ol/interaction';
import UndoRedo from 'ol-ext/interaction/UndoRedo';
import { v4 } from 'uuid';

import type { Feature, Map, MapBrowserEvent } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { DrawEvent } from 'ol/interaction/Draw';
import type { SelectEvent } from 'ol/interaction/Select';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';

import ConfirmModal from '@/components/Modals/ConfirmModal.vue';
import PropertiesEditorModal from '@/components/Modals/GeoJsonEditor/PropertiesEditorModal.vue';
import SourceModal from '@/components/Modals/GeoJsonEditor/SourceModal.vue';
import { getInteraction } from '@/composables/useGeoJsonEditor';
import FeatureStatus from '@/helpers/FeatureStyles/FeatureStatus';
import { getFeatureStyle } from '@/helpers/FeatureUtility';
import { DefaultProperties } from '@/interfaces/FeatureProperties';

const props = defineProps({
  /** Openlayersのマップオブジェクト */
  map: {
    type: Object as PropType<Map | undefined>,
    required: true
  },
  /** 編集対象のレイヤー */
  layer: {
    type: Object as PropType<VectorLayer<VectorSource>>,
    required: true
  }
});

/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditorStore();

/** GeoJsonソースモーダル */
const codeModal: Ref<InstanceType<typeof SourceModal> | undefined> = ref();

/** 確認モーダル */
const confirmModal: Ref<InstanceType<typeof ConfirmModal> | undefined> = ref();

/** プロパティ編集モーダル */
const propertiesModal: Ref<InstanceType<typeof PropertiesEditorModal> | undefined> = ref();

/** 選択されているインタラクション名 */
const selected: Ref<string> = ref('default');

/** クリック時の許容ピクセル */
const tolerance: Ref<number> = ref(2);

/** グリッドに吸着 */
const snap: Ref<boolean> = ref(false);

/** 更新要求フラグ */
const requestRefresh: WritableComputedRef<boolean> = computed({
  get: () => geoJsonEditorStore.requestRefresh,
  set: v => geoJsonEditorStore.setRefresh(v)
});

/** ピン一覧 */
const features: WritableComputedRef<Feature[]> = computed({
  get: () => geoJsonEditorStore.features,
  set: feats => geoJsonEditorStore.setFeatures(feats)
});

/**
 * 選択インタラクション
 *
 * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html}
 */
const selectInteraction = new Select({
  // シングルクリックのみ
  condition: (e: MapBrowserEvent) => e.type === MapBrowserEventType.SINGLECLICK,
  // 対象レイヤ
  layers: [props.layer],
  // 許容ピクセル
  hitTolerance: tolerance.value,
  // 選択時のスタイル
  style: (f: FeatureLike) => getFeatureStyle(f, FeatureStatus.SELECTED),
  multi: false
});

// プロパティ編集
selectInteraction.on('select', async (e: SelectEvent) => {
  if (selected.value !== 'edit') {
    // 選択モードでない場合は何もしない
    return;
  }
  /** UUID */
  const uuid = e.selected[0].getId();
  /** 対象レイヤーのソース */
  const source = props.layer.getSource();

  // selectが選択されていたときで、なおかつピンが一つ以上選択されていた時
  if (!uuid || !source) {
    return;
  }

  /** 選択されているピン */
  const feature = source.getFeatureById(uuid);

  if (!feature) {
    return;
  }

  // モーダルを開く
  propertiesModal.value?.show(feature);
});

/** グリッドに吸着インタラクション */
const snapInteraction: Snap = new Snap({ source: props.layer.getSource()! });

/** 登録されているインタラクション */
let currentInteraction: Interaction | undefined = undefined;

/** 取り消し／やり直し */
const undoRedoInteraction: UndoRedo = new UndoRedo();

/** ツールバーの選択変更時 */
watch(selected, current => {
  /** マップのインスタンス */
  const map = props.map!;
  console.log('mode: ', current);

  // 選択されているピンを解除
  selectInteraction.getFeatures().clear();

  // 一旦インタラクションを解除する
  if (currentInteraction) {
    map.removeInteraction(currentInteraction);
    if (current === 'default') {
      return;
    }
  }

  // 吸着インタラクション
  if (!snap.value) {
    map.addInteraction(snapInteraction);
  } else {
    map.removeInteraction(snapInteraction);
  }

  currentInteraction = getInteraction(
    current,
    props.layer,
    tolerance.value,
    selectInteraction.getFeatures()
  );

  if (currentInteraction) {
    // 描画完了時に実行
    (currentInteraction as Draw).on('drawend', (e: DrawEvent) => {
      /** プロパティ */
      const p = DefaultProperties;
      // ユニークIDをピン／ライン／ポリゴンに追記
      e.feature.setId(v4());
      e.feature.setProperties(p);
      // カーソルをポインタに戻す
      selected.value = 'translate';
      return e;
    });

    // console.log('set: ', interaction.value, currentInteraction);
    currentInteraction.on('change', e => console.log(e));
    currentInteraction.on('error', e => console.error(e));
    currentInteraction.on('propertychange', e => console.log(e));
    map.addInteraction(currentInteraction);
  }
});

/** ピンの選択解除 */
const unSelectFeature = () => selectInteraction.getFeatures().clear();

/**
 * ピンを更新
 *
 * @param feature - 対象ピン
 */
const updateFeature = (feature: Feature) => {
  /** UUIDを取得 */
  const uuid = feature.getId();
  /** ソース */
  const source = props.layer.getSource();

  if (!uuid || !source) {
    // UUIDがセットされていない場合は何もしない
    //message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  /** 一致するピン */
  const f = source.getFeatureById(uuid);

  if (!f) {
    //message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  // 代入
  f.setProperties(feature.getProperties());

  // ピンをセット
  features.value = source.getFeatures();
  requestRefresh.value = true;

  // ピンの選択解除
  unSelectFeature();

  //message.value = t('map.editor.messages.feature-saved');
};

/**
 * ピンを削除
 *
 * @param feature - 対象ピン
 */
const deleteFeature = (feature: Feature) => {
  /** UUIDを取得 */
  const uuid = feature.getId();
  /** ソース */
  const source = props.layer.getSource()!;

  if (!uuid || !source) {
    // セットされていない場合は何もしない
    // message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  /** 一致するピン */
  const f = source.getFeatureById(uuid);

  if (!f) {
    // message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  // 削除
  source.removeFeature(f);
  // ピンの選択解除
  unSelectFeature();

  features.value = source.getFeatures();
  requestRefresh.value = true;
};

/** ソースを表示 */
const showSource = () => {
  features.value = props.layer.getSource()!.getFeatures();
  codeModal.value?.show();
};

/** ピンを再描画 */
const redraw = () => {
  const source = props.layer.getSource()!;
  // 一旦クリア
  source.clear();
  // ピン流し込み
  source.addFeatures(features.value);
  // ピン一覧データを流し込み
  props.layer.setSource(source);
};

/** すべてのピンを削除する */
const clear = () => {
  geoJsonEditorStore.clear();
  redraw();
};

/** グリッドに吸着 */
const toggleSnap = () => {
  const map = props.map!;
  if (!snap.value) {
    map.addInteraction(snapInteraction);
  } else {
    map.removeInteraction(snapInteraction);
  }
  snap.value = !snap.value;
};

/** DOM更新時 */
onMounted(() => {
  /** マップのインスタンス */
  const map = props?.map;
  if (!map) {
    return;
  }
  if (currentInteraction) {
    // 現在のインタラクションをマップに追加
    map.addInteraction(currentInteraction);
  }
  // 取り消し／やり直しインタラクションを登録
  map.addInteraction(undoRedoInteraction);
  // ピン選択を有効化
  map.addInteraction(selectInteraction);
});
</script>

<template>
  <!-- ツールバー -->
  <v-toolbar color="primary" dense elevation="2">
    <v-btn-toggle v-model="selected" class="px-0" variant="text" theme="dark">
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
          :icon="`mdi-grid${snap ? '' : '-off'}`"
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
        <v-btn icon="mdi-undo" tile v-bind="slotProps" @click="undoRedoInteraction.undo()" />
      </template>
      Undo
    </v-tooltip>
    <v-tooltip location="bottom">
      <template #activator="{ props: slotProps }">
        <v-btn icon="mdi-redo" tile v-bind="slotProps" @click="undoRedoInteraction.redo()" />
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
  <source-modal ref="codeModal" @close="redraw" />
</template>
