<script setup lang="ts">
import { useGlobal, useMapCursor, useGeoJsonEditor, useLocationMarker } from '@/store';
import {
  computed,
  nextTick,
  onMounted,
  onUpdated,
  ref,
  watch,
  type Ref,
  type WritableComputedRef
} from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import MapBrowserEventType from 'ol/MapBrowserEventType';
import GeoJSON, { type GeoJSONObject } from 'ol/format/GeoJSON';
import { Draw, Interaction, Select, Snap } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import UndoRedo from 'ol-ext/interaction/UndoRedo';
import { v4 as uuidv4 } from 'uuid';

import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import type { DrawEvent } from 'ol/interaction/Draw';
import type { SelectEvent } from 'ol/interaction/Select';

// コンポーネント
import MapComponent from '@/components/Map/MapComponent.vue';
import ConfirmModal from '@/components/Modals/ConfirmModal.vue';
import PropertiesEditorModal from '@/components/Modals/GeoJsonEditor/PropertiesEditorModal.vue';
import SourceModal from '@/components/Modals/GeoJsonEditor/SourceModal.vue';
// ヘルパ
import FeatureStatus from '@/helpers/FeatureStyles/FeatureStatus';
import { getFeatureStyle, setFeaturesStyle } from '@/helpers/FeatureUtility';
import { getInteraction } from '@/helpers/GeoJsonEditor';
import { DefaultProperties } from '@/interfaces/FeatureProperties';

/** グローバルストア */
const globalStore = useGlobal();
/** マップカーソルストア */
const mapCursorStore = useMapCursor();
/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditor();
/** マップのロケーションマーカーのストア */
const locationMarkerStore = useLocationMarker();

/** マップ */
const mapComponent: Ref<InstanceType<typeof MapComponent> | undefined> = ref();
/** プロパティ編集モーダル */
const propertiesModal: Ref<InstanceType<typeof PropertiesEditorModal> | undefined> = ref();

/** GeoJsonソースモーダル */
const codeModal: Ref<InstanceType<typeof SourceModal> | undefined> = ref();

/** 確認モーダル */
const confirmModal: Ref<InstanceType<typeof ConfirmModal> | undefined> = ref();

/** 再描画フラグ */
const ready: Ref<boolean> = ref(false);

/** 選択されているインタラクション名 */
const interaction: Ref<string> = ref('default');

/** クリック時の許容ピクセル */
const tolerance: Ref<number> = ref(2);

/** グリッドに吸着 */
const snap: Ref<boolean> = ref(false);

/** Message */
const message: WritableComputedRef<string> = computed({
  get: () => globalStore.message,
  set: v => globalStore.setMessage(v)
});

/** GeoJsonデータ */
const geojson: WritableComputedRef<GeoJSONObject> = computed({
  get: () => geoJsonEditorStore.geojson,
  set: value => geoJsonEditorStore.setGeoJson(value)
});

/** 更新要求フラグ */
const requestRefresh: WritableComputedRef<boolean> = computed({
  get: () => geoJsonEditorStore.requestRefresh,
  set: v => geoJsonEditorStore.setRefresh(v)
});

/** loading overlay visibility */
const loading: WritableComputedRef<boolean> = computed({
  get: () => globalStore.loading,
  set: v => globalStore.setLoading(v)
});

/** レイヤ */
const level: WritableComputedRef<number> = computed({
  get: () => mapCursorStore.level,
  set: l => mapCursorStore.setLevel(l)
});

/** ピン一覧 */
const features: WritableComputedRef<Feature[]> = computed({
  get: () => new GeoJSON().readFeatures(geojson.value),
  set: feats => {
    // カウンタ
    let count = 0;
    // 番号振り直し
    feats.forEach((f: Feature) => {
      count++;
      // 各ピンにUUIDとプロパティを入れる
      if (!f.getId()) {
        // IDがない場合補完
        f.setId(uuidv4());
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

    geojson.value = JSON.parse(new GeoJSON().writeFeatures(feats));
  }
});

/** 場所レイヤー */
const locationLayer: VectorLayer<VectorSource> = new VectorLayer({
  properties: { id: 'locationLayer' },
  zIndex: 5
});

/** ベクターソース */
const editorSource: VectorSource = new VectorSource({
  features: features.value
});

/** ベクターレイヤ */
const editorLayer: VectorLayer<VectorSource> = new VectorLayer<VectorSource>({
  source: editorSource,
  style: f => getFeatureStyle(f),
  zIndex: 10,
  properties: {
    id: 'editorLayer'
  }
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
  layers: [editorLayer],
  // 許容ピクセル
  hitTolerance: tolerance.value,
  // 選択時のスタイル
  style: (f: FeatureLike) => getFeatureStyle(f, FeatureStatus.SELECTED),
  multi: false
});

/** グリッドに吸着インタラクション */
const snapInteraction: Snap = new Snap({ source: editorSource });

/** 登録されているインタラクション */
let currentInteraction: Interaction | undefined = undefined;

/** 取り消し／やり直し */
const undoRedoInteraction: UndoRedo = new UndoRedo();
// 取り消し時の一部のインタラクションを除外
/*
undoRedoInteraction.on('undo', e => {
  if (e.action.type === 'addfeature') {
    selectInteraction.getFeatures().clear();
    if (interaction.value === 'transform' && currentInteraction) {
      (currentInteraction as Transform).select();
    }
  }
});
*/
/** ツールバーの選択変更時 */
watch(
  () => interaction.value,
  current => {
    /** マップのインスタンス */
    const map = mapComponent.value?.map;
    if (!map || !current) {
      return;
    }

    // 選択されているピンを解除
    selectInteraction.getFeatures().clear();

    // 一旦インタラクションを解除する
    if (currentInteraction) {
      map.removeInteraction(currentInteraction);
      if (current === 'default') {
        return;
      }
    }

    if (!snap.value) {
      map.addInteraction(snapInteraction);
    } else {
      map.removeInteraction(snapInteraction);
    }

    currentInteraction = getInteraction(
      current,
      editorLayer,
      tolerance.value,
      selectInteraction.getFeatures()
    );

    if (currentInteraction) {
      // 描画完了時に実行
      (currentInteraction as Draw).on('drawend', (e: DrawEvent) => {
        /** プロパティ */
        const p = DefaultProperties;
        // ユニークIDをピンに追記
        e.feature.setId(uuidv4());
        e.feature.setProperties(p);
        // カーソルをポインタに戻す
        interaction.value = 'translate';
        return e;
      });

      // console.log('set: ', interaction.value, currentInteraction);
      currentInteraction.on('change', e => console.log(e));
      currentInteraction.on('error', e => console.error(e));
      currentInteraction.on('propertychange', e => console.log(e));
      map.addInteraction(currentInteraction);
    }
  }
);

/** レイヤー切替時 */
watch(
  () => level.value,
  value => {
    /** マップ */
    const map = mapComponent.value?.map;
    if (!map) {
      return;
    }
    /** 読み込まれているレイヤ */
    const layers = map.getLayers();

    layers.forEach(l => {
      if (l instanceof VectorLayer) {
        // レイヤスタイルを上書き
        setFeaturesStyle(l, value);
      }
      return l;
    });
    // 上書き
    map.setLayers(layers);
  }
);

watch(
  () => message.value,
  s => mapComponent.value?.notification.show(s)
);

/** ベクターソースをリロード */
const redraw = async () => {
  /** マップのインスタンス */
  const map = mapComponent.value?.map;

  if (!map || !requestRefresh.value) {
    return;
  }
  // 一旦クリア
  editorSource.clear();
  // ピン流し込み
  editorSource.addFeatures(new GeoJSON().readFeatures(geojson.value));
  // ピン一覧データを流し込み
  editorLayer.setSource(editorSource);
  await nextTick();
};

/** ピンの選択解除 */
const unSelectFeature = () => selectInteraction.getFeatures().clear();

/**
 * ピンを更新
 *
 * @param feature - 対象ピン
 */
const updateFeature = async (feature: Feature) => {
  /** UUIDを取得 */
  const uuid = feature.getId();

  if (!uuid) {
    // セットされていない場合は何もしない
    //message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  /** 一致するピン */
  const f = editorSource.getFeatureById(uuid);

  if (!f) {
    //message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  // 代入
  f.setProperties(feature.getProperties());
  await nextTick();

  // ピンをセット
  features.value = editorSource.getFeatures();

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
const deleteFeature = async (feature: Feature) => {
  /** UUIDを取得 */
  const uuid = feature.getId();

  if (!uuid) {
    // セットされていない場合は何もしない
    // message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  /** 一致するピン */
  const f = editorSource.getFeatureById(uuid);

  if (!f) {
    // message.value = t('map.editor.messages.feature-notfound');
    return;
  }

  // 削除
  editorSource.removeFeature(f);
  // ピンの選択解除
  unSelectFeature();

  features.value = editorSource.getFeatures();
  requestRefresh.value = true;
  await nextTick();
};

/** ソースを表示 */
const showSource = () => {
  features.value = editorSource.getFeatures();
  codeModal.value?.show();
};

/** 全削除確認モーダル */
const showClearConfirm = () => confirmModal.value?.show();

/** すべてのピンを削除する */
const clear = () => {
  geoJsonEditorStore.clear();
  redraw();
};

/** グリッドに吸着 */
const toggleSnap = () => {
  /** マップのインスタンス */
  const map = mapComponent.value?.map;
  if (!map) {
    return;
  }

  if (!snap.value) {
    map.addInteraction(snapInteraction);
  } else {
    map.removeInteraction(snapInteraction);
  }
  snap.value = !snap.value;
};

/** 準備完了 */
onMounted(async () => {
  /** マップのインスタンス */
  const map = mapComponent.value?.map;
  if (!map) {
    return;
  }
  loading.value = true;
  locationLayer.setSource(
    new VectorSource({
      features: new GeoJSON().readFeatures(locationMarkerStore.geojson)
    })
  );
  setFeaturesStyle(locationLayer, level.value);

  // 場所レイヤを追加
  map.addLayer(locationLayer);
  // 記入用レイヤをマップに追加
  map.addLayer(editorLayer);

  // 取り消し／やり直しインタラクションを登録
  map.addInteraction(undoRedoInteraction);

  // ピン選択を有効化
  map.addInteraction(selectInteraction);

  // プロパティ編集
  selectInteraction.on('select', async (e: SelectEvent) => {
    if (interaction.value !== 'edit') {
      // プロパティ編集が選択されていないときは処理しない。
      return;
    }
    /** UUID */
    const id = e.selected[0].getId();

    // selectが選択されていたときで、なおかつピンが一つ以上選択されていた時
    if (!id) {
      return;
    }

    /** 選択されているピン */
    const feature = editorSource.getFeatureById(id);

    if (!feature) {
      return;
    }

    // モーダルを開く
    propertiesModal.value?.show(feature);
  });

  // 初期選択
  loading.value = false;
});

/** DOM更新時 */
onUpdated(() => {
  /** マップのインスタンス */
  const map = mapComponent.value?.map;
  if (map && currentInteraction) {
    map.addInteraction(currentInteraction);
  }
});

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.region !== from.params.region) {
    ready.value = false;
  }
  next();
  await nextTick();
  if (to.params.region !== from.params.region) {
    ready.value = true;
  }
});
</script>

<template>
  <v-container fluid class="px-0 py-0 d-flex flex-column h-100">
    <!-- ツールバー -->
    <v-toolbar color="primary" dense elevation="2">
      <v-btn-toggle v-model="interaction" class="px-0" variant="text" theme="dark">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-cursor-default" tile value="default" v-bind="props" />
          </template>
          Default
        </v-tooltip>
        <v-divider vertical />
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-point-select" tile value="edit" v-bind="props" />
          </template>
          Edit Properties
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-arrow-all" tile value="translate" v-bind="props" />
          </template>
          Move
        </v-tooltip>
        <v-divider vertical />
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-polyline-edit" tile value="modify" v-bind="props" />
          </template>
          Modify (Alt + Click to delete point.)
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-square-edit" tile value="transform" v-bind="props" />
          </template>
          Rotate
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-square-remove" tile value="delete" v-bind="props" />
          </template>
          Delete
        </v-tooltip>
        <v-divider vertical />
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-point-plus" tile value="point" v-bind="props" />
          </template>
          Point
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-line" tile value="line" v-bind="props" />
          </template>
          Line
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-polygon" tile value="polygon" v-bind="props" />
          </template>
          Polygon
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-difference" tile value="hole" v-bind="props" />
          </template>
          Draw Hole
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-square" tile value="square" v-bind="props" />
          </template>
          Square
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-vector-circle" tile value="circle" v-bind="props" />
          </template>
          Circle
        </v-tooltip>
        <v-divider vertical />
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn icon="mdi-format-color-fill" tile value="fill" v-bind="props" />
          </template>
          Fill
        </v-tooltip>
      </v-btn-toggle>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn :icon="`mdi-grid${snap ? '' : '-off'}`" tile v-bind="props" @click="toggleSnap" />
        </template>
        Snap
      </v-tooltip>
      <v-divider vertical />
      <v-spacer />
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-undo" tile v-bind="props" @click="undoRedoInteraction.undo()" />
        </template>
        Undo
      </v-tooltip>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-redo" tile v-bind="props" @click="undoRedoInteraction.redo()" />
        </template>
        Redo
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-delete" tile v-bind="props" @click="showClearConfirm" />
        </template>
        Clear
      </v-tooltip>
      <v-divider vertical />
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn icon="mdi-code-json" tile v-bind="props" @click="showSource" />
        </template>
        Geojson Source
      </v-tooltip>
      <!-- 削除確認モーダル -->
      <confirm-modal
        ref="confirmModal"
        title="Clear"
        message="Are you sure you want to remove all pins?"
        danger
        @submit="clear"
      />
      <!-- 詳細編集 -->
      <properties-editor-modal
        ref="propertiesModal"
        @submit="updateFeature"
        @delete="deleteFeature"
        @cancel="unSelectFeature"
      />
      <!-- GeoJson Editor-->
      <source-modal ref="codeModal" @close="redraw" />
    </v-toolbar>
    <!-- マップ -->
    <map-component ref="mapComponent" class="my-0" />
  </v-container>
</template>
