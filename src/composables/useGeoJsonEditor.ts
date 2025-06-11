import { useGeoJsonEditorStore } from '@/store';
import { ref, watch, onUnmounted, unref, type Ref } from 'vue';

import MapBrowserEventType from 'ol/MapBrowserEventType';
import { shiftKeyOnly } from 'ol/events/condition';
import { Draw, Modify, Translate, Select, Snap, Interaction } from 'ol/interaction';
import Delete from 'ol-ext/interaction/Delete';
import DrawHole from 'ol-ext/interaction/DrawHole';
import DrawRegular from 'ol-ext/interaction/DrawRegular';
import FillAttribute from 'ol-ext/interaction/FillAttribute';
import Transform from 'ol-ext/interaction/Transform';
import UndoRedo from 'ol-ext/interaction/UndoRedo';
import { v4 } from 'uuid';

import type { Map, Feature, MapBrowserEvent } from 'ol';
import type Collection from 'ol/Collection';
import type { FeatureLike } from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { DrawEvent } from 'ol/interaction/Draw';
import type { SelectEvent } from 'ol/interaction/Select';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';

import FeatureStatus from '@/helpers/FeatureStyles/FeatureStatus';
import { getFeatureStyle } from '@/helpers/FeatureUtility';
import { DefaultProperties } from '@/interfaces/FeatureProperties';

/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditorStore();

// Composableに渡すオプションの型定義
interface UseGeoJsonEditorOptions {
  /** OpenLayersマップオブジェクト */
  map: Ref<Map>;
  /** 編集対象のベクターレイヤー */
  layer: Ref<VectorLayer<VectorSource>>;
}

// Composableの本体
export default function useGeoJsonEditor(options: UseGeoJsonEditorOptions) {
  const { map, layer } = options;

  // --- State ---
  const selectedTool = ref('default');
  const tolerance = ref(2);
  const isSnapEnabled = ref(false);

  // --- OpenLayers Interactions ---
  // Composable内でインタラクションを管理

  /** 取り消し／やり直し */
  const undoRedoInteraction = new UndoRedo();

  /**
   * 選択インタラクション
   *
   * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html}
   */
  const selectInteraction = new Select({
    condition: (e: MapBrowserEvent) => e.type === MapBrowserEventType.SINGLECLICK,
    layers: [unref(layer)], // Refから値を取り出す
    hitTolerance: unref(tolerance),
    style: (f: FeatureLike) => getFeatureStyle(f, FeatureStatus.SELECTED),
    multi: false
  });

  /** グリッドに吸着インタラクション */
  const snapInteraction: Snap = new Snap({ source: unref(layer).getSource()! });

  /** 現在選択されているインタラクション */
  let currentInteraction: Interaction | undefined = undefined;

  // --- Feature to be Edited ---
  // 編集対象のFeatureをコンポーネントに通知するためのRef
  const featureToEdit = ref<Feature>();

  // --- Event Handlers ---
  selectInteraction.on('select', (e: SelectEvent) => {
    if (unref(selectedTool) !== 'edit' || e.selected.length === 0) {
      return;
    }
    const feature = e.selected[0];
    if (feature) {
      // 編集対象のFeatureをセットする。コンポーネント側でこれをwatchしてモーダルを開く
      featureToEdit.value = feature;
    }
  });

  // --- Watcher for tool changes ---
  // ツールの変更を監視し、適切なインタラクションを設定
  watch(selectedTool, newTool => {
    const olMap = unref(map);

    // 初期化
    selectInteraction.getFeatures().clear();
    if (currentInteraction) {
      olMap.removeInteraction(currentInteraction);
    }
    // 'default'モードは何もしない
    if (newTool === 'default') {
      currentInteraction = undefined;
      return;
    }

    // 新しいインタラクションを取得して設定
    currentInteraction = getInteraction(
      newTool,
      unref(layer),
      unref(tolerance),
      selectInteraction.getFeatures()
    );

    if (!currentInteraction) {
      return;
    }
    // Drawインタラクションにイベントハンドラを設定
    (currentInteraction as Draw).on('drawend', (e: DrawEvent) => {
      onFeatureChange(e.feature);
      return e;
    });
    currentInteraction.on('change', e => console.log(e));
    currentInteraction.on('error', e => console.error(e));
    currentInteraction.on('propertychange', e => console.log(e));

    olMap.addInteraction(currentInteraction);
  });

  // --- Methods exposed to the component ---
  const onFeatureChange = (feature: Feature) => {
    feature.setId(v4());
    feature.setProperties(DefaultProperties);
    // 描画後は自動で移動モードに切り替える
    selectedTool.value = 'translate';
    updateFeature(feature);
  };

  const unSelectFeature = () => {
    selectInteraction.getFeatures().clear();
    featureToEdit.value = undefined; // 編集対象もクリア
  };

  /**
   * ピンを更新
   *
   * @param feature - 対象ピン
   */
  const updateFeature = (feature: Feature) => {
    const source = unref(layer).getSource();
    if (!source) return;

    // 既存のフィーチャーをIDで取得
    const id = feature.getId();
    // IDがない場合は新規作成
    const existingFeature = id ? source.getFeatureById(id) : null;

    if (existingFeature) {
      // 既存のフィーチャーがある場合は更新
      existingFeature.setProperties(feature.getProperties());
      // ストアに保存
      geoJsonEditorStore.setFeatures(source.getFeatures());
      geoJsonEditorStore.setRefresh(true);
    }

    unSelectFeature();
  };

  /**
   * ピンを削除
   *
   * @param feature - 対象ピン
   */
  const deleteFeature = (feature: Feature) => {
    const source = unref(layer).getSource();
    if (!source) return;

    const id = feature.getId();
    const existingFeature = id ? source.getFeatureById(id) : null;

    if (existingFeature) {
      // 対象のフィーチャーを削除
      source.removeFeature(existingFeature);
      // ストアからも削除
      geoJsonEditorStore.setFeatures(source.getFeatures());
      geoJsonEditorStore.setRefresh(true);
    }
    unSelectFeature();
  };

  /** ピンを再描画 */
  const redrawFeatures = () => {
    const source = unref(layer).getSource();
    if (!source) return;
    // 一旦クリア
    source.clear();
    // ストアからフィーチャーを取得してソースに追加
    source.addFeatures(geoJsonEditorStore.features);
  };

  /** 全てのフィーチャーをクリア */
  const clearAllFeatures = () => {
    geoJsonEditorStore.clear();
    redrawFeatures();
  };

  /** スナップ機能のトグル */
  const toggleSnap = () => (isSnapEnabled.value = !isSnapEnabled.value);

  // --- Undo/Redo Methods ---
  const undo = () => undoRedoInteraction.undo();
  const redo = () => undoRedoInteraction.redo();

  // --- Lifecycle Hooks ---
  watch(
    map,
    newMap => {
      if (newMap) {
        // マップに基本的なインタラクションを追加
        newMap.addInteraction(undoRedoInteraction);
        newMap.addInteraction(selectInteraction);
        if (isSnapEnabled.value) {
          newMap.addInteraction(snapInteraction);
        } else {
          newMap.removeInteraction(snapInteraction);
        }
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    const olMap = unref(map);
    // コンポーネントが破棄される際にインタラクションを全て削除
    olMap.removeInteraction(undoRedoInteraction);
    olMap.removeInteraction(selectInteraction);
    olMap.removeInteraction(snapInteraction);
    if (currentInteraction) {
      olMap.removeInteraction(currentInteraction);
    }
  });

  // コンポーネント側で利用する状態とメソッドを返す
  return {
    selectedTool,
    isSnapEnabled,
    featureToEdit,
    undo,
    redo,
    toggleSnap,
    clearAllFeatures,
    redrawFeatures,
    updateFeature,
    deleteFeature,
    unSelectFeature
  };
}

/**
 * インタラクションを取得
 *
 * @param name - インタラクション名
 * @param vector - ベクターレイヤー
 * @param tolerance - 許容誤差
 * @param features - 選択済みのピン／ポリゴン
 */
function getInteraction(
  name: string,
  vector: VectorLayer<VectorSource>,
  tolerance: number,
  features?: Collection<Feature<Geometry>>
): Interaction | undefined {
  const source = vector.getSource();
  if (!source) {
    return;
  }
  switch (name) {
    case 'translate':
      /** 移動インタラクション */
      return new Translate({
        features,
        hitTolerance: tolerance
      });
    case 'modify':
      // 変形
      return new Modify({ source });
    case 'delete':
      // 選択を削除
      return new Delete({ layers: [vector], hitTolerance: tolerance });
    case 'point':
      // 点を描画
      return new Draw({
        source,
        type: 'Point'
      });
    case 'line':
      // 線を描画
      return new Draw({
        source,
        type: 'LineString'
      });
    case 'square':
      // 四角形を描画
      return new DrawRegular({
        // 対象ソース
        source,
        // 角の数。2以下は円。
        sides: 4,
        // 回転可能か
        canRotate: true,
        // クリック許容範囲
        clickTolerance: tolerance
      });
    case 'circle':
      // 円形を描画
      return new DrawRegular({
        // 対象ソース
        source,
        // 円
        sides: 2,
        // 回転可能か
        canRotate: false,
        // クリック許容範囲
        clickTolerance: tolerance
      });
    case 'polygon':
      // 多角形を描画
      return new Draw({
        source,
        type: 'Polygon',
        // クリック許容範囲
        clickTolerance: tolerance
      });
    case 'transform': {
      // 変形

      // 変化カーソルの塗りつぶし
      Transform.prototype.Cursors.rotate =
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXAgMAAACdRDwzAAAAAXNSR0IArs4c6QAAAAlQTFRF////////AAAAjvTD7AAAAAF0Uk5TAEDm2GYAAAABYktHRACIBR1IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH2wwSEgUFmXJDjQAAAEZJREFUCNdjYMAOuCCk6goQpbp0GpRSAFKcqdNmQKgIILUoNAxIMUWFhoKosNDQBKDgVAilCqcaQBogFFNoGNjsqSgUTgAAM3ES8k912EAAAAAASUVORK5CYII=') 5 5, auto";
      // 変形カーソルの破線
      Transform.prototype.Cursors.rotate0 =
        "url('data:image/png;base64,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') 5 5, auto";

      /** 変形インタラクション */
      const transform = new Transform({
        enableRotatedTransform: false,
        // Shiftキーを押したときのインタラクション
        addCondition: shiftKeyOnly,
        // 対象フィルタ
        // filter: function(f,l) { return f.getGeometry().getType()==='Polygon'; },
        // 対象レイヤー
        layers: [vector],
        // 許容範囲
        hitTolerance: tolerance,
        // 移動
        translateFeature: true,
        // リサイズ
        scale: true,
        // 回転
        rotate: true,
        // アスペクト比を保持したまま拡大縮小
        keepAspectRatio: shiftKeyOnly,
        // オブジェクトの範囲を常時表示
        keepRectangle: false,
        // 移動
        translate: true,
        // 変形
        stretch: true
      });

      /** 開始座標 */
      const firstPoint = false;
      // 選択時に対象ポリゴンの中心を基準とする
      transform.on(['select'], (e: any) => {
        if (firstPoint && e.features?.getLength()) {
          transform.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
        }
      });
      return transform;
    }
    // 塗りつぶし
    case 'fill':
      // TODO: 色選択
      return new FillAttribute({ name: 'fill color' }, { color: 'red' });
    case 'hole': {
      // TODO: as any
      const hole = new DrawHole({ layers: [vector], type: 'Polygon' });
      source.removeFeature(hole.getPolygon() as any);
      return hole;
    }
    default:
      console.log('unmounted interaction: ', name);
  }
}
