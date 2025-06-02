import { type FeatureLike } from 'ol/Feature';
import { Style, Fill, Stroke, Text, Icon } from 'ol/style';

import type { GeoJsonProperties } from 'geojson';

// --- 型定義 -----------------------------------------------------------------

/**
 * スプライトJSONのエントリの型定義
 */
interface SpriteInfo {
  width: number;
  height: number;
  x: number;
  y: number;
  pixelRatio: number;
}

/**
 * アイコンスタイルのオプション型定義
 */
interface IconStyleOption {
  src: string;
  size: [number, number];
  offset: [number, number];
  scale: number;
}

/**
 * フィーチャーのプロパティの型定義 (必要に応じて拡張)
 */
type FeatureProperties = {
  layer: string;
  ftCode?: number;
  alti?: number;
  rnkWidth?: number;
  rdCtg?: number;
  motorway?: number;
  lvOrder?: number;
  railState?: number;
  staCode?: number;
  name?: string;
  knj?: string;
  annoCtg?: number;
} & GeoJsonProperties;

// --- 定数 -------------------------------------------------------------------

const SPRITE_JSON_URL = 'https://maps.gsi.go.jp/vector/sprite/std.json';
const SPRITE_PNG_URL = 'https://maps.gsi.go.jp/vector/sprite/std.png';

const ROAD_LINE_DASH = [5, 5];

/** アイコンコードとアイコン名のマッピング */
const ICON_NAMES_MAP: Map<number, string> = new Map([
  [1401, '都道府県所在地-20'],
  [1402, '市役所・東京都の区役所-20'],
  [1403, '町村役場・政令指定都市の区役所-20'],
  [3201, '官公署'],
  [3202, '裁判所'],
  [3205, '市役所・東京都の区役所'],
  [3206, '町村役場・政令指定都市の区役所'],
  [3211, '交番'],
  [3212, '高等学校・中等教育学校'],
  [3214, '小学校'],
  [3213, '中学校'], // Note: 3214 '小学校'が重複しているため、ここでは3213を定義
  // [3214, '小学校'], // 重複定義なので削除または意図を確認
  [3215, '老人ホーム'],
  [3216, '博物館法の登録博物館・博物館相当施設'],
  [3217, '図書館'],
  [3218, '郵便局'],
  [3221, '灯台'],
  [3231, '神社'],
  [3232, '寺院'],
  [3241, '警察署'],
  [3242, '消防署'],
  [3243, '病院'],
  [3244, '保健所'],
  [4101, '煙突'],
  [4102, '風車'],
  [4103, '油井・ガス井'],
  [4104, '記念碑'],
  [4105, '自然災害伝承碑'],
  [6301, '墓地'],
  [6311, '田'],
  [6312, '畑'],
  [6313, '茶畑'],
  [6314, '果樹園'],
  [6321, '広葉樹林'],
  [6322, '針葉樹林'],
  [6323, '竹林'],
  [6324, 'ヤシ科樹林'],
  [6325, 'ハイマツ地'],
  [6326, '笹地'],
  [6327, '荒地'],
  [6331, '温泉'],
  [6332, '噴火口・噴気口'],
  [6341, '史跡・名勝・天然記念物'],
  [6342, '城跡'],
  [6351, '採鉱地'],
  [6361, '港湾'],
  [6362, '漁港'],
  [6367, '特定重要港-20'],
  [6368, '重要港-20'],
  [6371, '国際空港-20'],
  [6372, '自衛隊等の飛行場-20'],
  [6375, '国際空港-20'], // 重複しているが、元コード通り
  [6376, '国際空港以外の拠点空港等-20'],
  [6381, '自衛隊-20'],
  [7102, '三角点'],
  [7103, '水準点'],
  [7101, '電子基準点'],
  [8103, '発電所等'],
  [8105, '電波塔'],
  [51301, '人口100万人以上-500'],
  [51302, '人口50万-100万人未満-500'],
  [51303, '人口50万人未満-500'],
  [56368, '主要な港-500'],
  [56376, '主要な空港-500']
]);

// --- スプライト関連関数 -----------------------------------------------------

/**
 * 指定されたパスからJSONデータを非同期で読み込む
 * @param path JSONファイルのパス
 * @returns 読み込んだJSONデータ、またはエラーの場合はnull
 */
const loadJSON = async (path: string): Promise<Record<string, SpriteInfo> | null> => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.error(`Failed to load JSON from ${path}: ${response.statusText}`);
      return null;
    }
    const data: Record<string, SpriteInfo> = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading JSON from ${path}:`, error);
    return null;
  }
};

// スプライトJSONを一度だけ読み込む
// トップレベルawaitはES modules環境でのみ利用可能。
// それ以外の環境ではIIFE (Immediately Invoked Function Expression) を使うか、
// 必要になったタイミングでawaitで呼び出すようにする。
let spriteJson: Record<string, SpriteInfo> | null = null;

// アプリケーション起動時に一度読み込む例 (IIFEを使用)
(async () => {
  spriteJson = await loadJSON(SPRITE_JSON_URL);
  if (!spriteJson) {
    console.warn('Failed to load sprite JSON. Icon styles may not work correctly.');
  }
})();

/**
 * アイコン名に基づいてOpenLayersのIconスタイルオプションを生成
 * @param iconname アイコン名
 * @returns IconStyleOptionオブジェクト、またはnull
 */
const getIconStyleOption = (iconname: string): IconStyleOption | null => {
  if (!spriteJson) {
    console.warn('Sprite JSON not loaded yet. Cannot get icon style.');
    return null;
  }

  const info = spriteJson[iconname];
  if (info) {
    const scale = info.y < 770 ? 0.5 : 0.3;
    return {
      src: SPRITE_PNG_URL,
      size: [info.width, info.height],
      offset: [info.x, info.y],
      scale: scale
    };
  } else {
    // console.warn(`Icon "${iconname}" not found in sprite JSON.`);
    return null;
  }
};

/**
 * コードに基づいてOpenLayersのIconスタイルを生成
 * @param code アイコンコード
 * @returns OpenLayersのIconスタイルオブジェクト、またはnull
 */
const getShowIcon = (code: number | string | undefined): Icon | undefined => {
  if (!code) {
    return;
  }

  const numericCode = +code; // 数値に変換
  const iconname = ICON_NAMES_MAP.get(numericCode) ?? '指示点'; // マップから取得、なければデフォルト

  const iconStyleOption = getIconStyleOption(iconname);
  if (iconStyleOption) {
    return new Icon(iconStyleOption);
  }
};

// --- 基本的な設定等 ---------------------------------------------------------

/**
 * プロパティが存在しない場合にデフォルト値を返すヘルパー関数
 * @param prop 検査するプロパティ
 * @param defaultValue デフォルト値
 * @returns プロパティの値、またはデフォルト値
 */
const checkProp = <T>(prop: T | undefined | null, defaultValue: T): T => {
  return prop ?? defaultValue;
};

/**
 * 道路の線の太さを決定する関数
 * @param f OpenLayersのFeatureオブジェクト
 * @returns 線の太さ
 */
const getRoadLineWidth = (f: FeatureLike): number =>
  (f.getProperties()?.rnkWidth ? +f.getProperties().rnkWidth : 1) + 1; // 元コードが+1されているため調整
/**
 * 道路の線の色を決定する関数
 * @param f OpenLayersのFeatureオブジェクト
 * @returns 線の色 (rgba文字列)
 */
const getRoadLineColor = (f: FeatureLike): string => {
  switch (f.getProperties()?.rdCtg) {
    case 0:
      return 'rgba(255,190,190,1)';
    case 1:
      return 'rgba(255,211,111,1)';
    default:
      return 'rgba(210,210,210,1)';
  }
};

/**
 * 等高線の線の太さを決定する関数
 * @param f OpenLayersのFeatureオブジェクト
 * @returns 線の太さ
 */
const getContourLineWidth = (f: FeatureLike): number => {
  const prop = f.getProperties();
  if (prop?.alti === undefined || prop?.alti === null) {
    return 0.5; // altがない場合はデフォルト
  }
  const keikyoku = +prop.alti % 50;
  return keikyoku === 0 ? 1 : 0.5;
};

// --- スタイリング関数 -------------------------------------------------------

/**
 * OpenLayersで地理院地図のベクタータイルを使用するためのスタイリング関数
 * @param feature OpenLayersのFeatureオブジェクト
 * @param resolution 現在の解像度 (使用されていないため、必要に応じて削除可能)
 * @returns スタイルオブジェクトの配列
 */
export const stylingVectorTile = (feature: FeatureLike, _resolution: number): Style[] => {
  const styles: Style[] = [];
  const properties = feature.getProperties() as FeatureProperties;
  const layer = properties?.layer;
  const ftCode = properties?.ftCode;
  const type = feature.getGeometry()?.getType(); // GeometryTypeを取得
  const alti = properties?.alti;
  const name = properties?.name;
  const knj = properties?.knj;
  // const rnkWidth = properties?.rnkWidth;
  const rdCtg = properties?.rdCtg;
  const motorway = properties?.motorway;
  const lvOrder = properties?.lvOrder;
  const railState = properties?.railState;
  const staCode = properties?.staCode;
  const annoCtg = properties?.annoCtg;

  // 各スタイル定義でgeometry関数が頻繁に呼ばれるため、キャッシュまたは条件を直接適用する
  // 効率化のため、ここでは主要なレイヤーごとに条件分岐を設けます。

  if (!properties) {
    return styles; // プロパティがない場合はスタイルを適用しない
  }

  // 水域
  if (layer === 'waterarea') {
    styles.push(
      new Style({
        fill: new Fill({ color: 'rgba(220,220,255,1)' })
      })
    );
  }

  if (layer === 'coastline' || layer === 'river' || layer === 'lake') {
    styles.push(
      new Style({
        stroke: new Stroke({ color: 'rgba(220,220,255,1)', width: 1 })
      })
    );
  }

  // 建物
  if (
    (layer === 'building' || layer === 'structurea') &&
    (type === 'Polygon' || type === 'MultiPolygon')
  ) {
    styles.push(
      new Style({
        fill: new Fill({ color: 'rgba(150,150,150,1)' }),
        zIndex: 100
      })
    );
  }
  if (layer === 'wstructurea') {
    styles.push(
      new Style({
        fill: new Fill({ color: 'rgba(255,255,255,1)' }),
        zIndex: 2
      })
    );
  }

  // 等高線
  if (layer === 'contour') {
    styles.push(
      new Style({
        stroke: new Stroke({
          color: 'rgba(230,230,230,1)',
          width: getContourLineWidth(feature)
        }),
        zIndex: 10
      })
    );
    if (ftCode === 7352 && alti !== undefined && alti !== null) {
      styles.push(
        new Style({
          text: new Text({
            text: String(alti),
            placement: 'line',
            fill: new Fill({ color: 'rgba(230,230,230,1)' }),
            stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
          }),
          zIndex: 11
        })
      );
    }
  }

  // 境界
  if (layer === 'boundary') {
    if (ftCode !== 6101) {
      styles.push(
        new Style({
          stroke: new Stroke({
            color: 'rgba(100,0,200,0.3)',
            width: 2,
            lineDash: [5, 3, 2, 2]
          }),
          zIndex: 10
        })
      );
    } else if (ftCode === 6101) {
      styles.push(
        new Style({
          stroke: new Stroke({
            color: 'rgba(230,230,230,1)',
            width: 1,
            lineDash: [5, 3, 2, 2]
          }),
          zIndex: 10
        })
      );
    }
  }

  // 道路
  if (layer === 'road') {
    const roadWidth = getRoadLineWidth(feature);
    const roadColor = getRoadLineColor(feature);
    const baseZIndex = 1000 + checkProp(lvOrder, 0) + 10;

    if (ftCode !== undefined && ftCode !== null) {
      if (ftCode > 2710 && ftCode < 9999 && motorway !== 1) {
        // 道路 通常部 (点線)
        styles.push(
          new Style({
            stroke: new Stroke({
              color: roadColor,
              width: 1,
              lineDash: [2, 2]
            }),
            zIndex: baseZIndex - checkProp(rdCtg, 0)
          })
        );
      } else if (ftCode === 2701 || ftCode === 2702) {
        // 道路 通常部 (実線)
        styles.push(
          new Style({
            stroke: new Stroke({
              color: motorway === 1 ? 'rgba(0,151,0,1)' : roadColor,
              width: roadWidth
            }),
            zIndex: baseZIndex - (motorway === 1 ? 0 : checkProp(rdCtg, 0))
          })
        );
      } else if (ftCode === 2703) {
        // 道路高架部
        styles.push(
          new Style({
            stroke: new Stroke({
              color: motorway === 1 ? 'rgba(0,151,0,1)' : roadColor,
              width: roadWidth
            }),
            zIndex: 10000 + checkProp(lvOrder, 0) + 1
          }),
          new Style({
            // 枠線
            stroke: new Stroke({
              color: 'rgba(255,255,255,1)',
              width: roadWidth + 2,
              lineCap: 'butt'
            }),
            zIndex: 10000 + checkProp(lvOrder, 0)
          })
        );
      } else if (ftCode === 2704) {
        // 道路トンネル部
        styles.push(
          new Style({
            stroke: new Stroke({
              color: motorway === 1 ? 'rgba(0,151,0,0.5)' : roadColor,
              width: roadWidth,
              lineDash: ROAD_LINE_DASH,
              lineCap: 'butt'
            }),
            zIndex: 20000
          })
        );
      }
    }
  }

  // 鉄道
  if (layer === 'railway') {
    const railLineColor = 'rgba(100,100,100,1)';
    const railLineWidth = 1.5;

    if (railState) {
      if (![1, 2, 3, 5, 100, 300].includes(railState)) {
        // 通常
        styles.push(
          new Style({
            stroke: new Stroke({ color: railLineColor, width: railLineWidth }),
            zIndex: 1000 + 10 + 1
          })
        );
      } else if (railState === 1) {
        // 高架
        styles.push(
          new Style({
            stroke: new Stroke({ color: railLineColor, width: railLineWidth }),
            zIndex: 10000 + checkProp(lvOrder, 0) + 1
          }),
          new Style({
            // 枠線
            stroke: new Stroke({
              color: 'rgba(255,255,255,1)',
              width: 4,
              lineCap: 'butt'
            }),
            zIndex: 10000 + checkProp(lvOrder, 0)
          })
        );
      } else if ([2, 3, 100, 300].includes(railState)) {
        // トンネル
        styles.push(
          new Style({
            stroke: new Stroke({ color: railLineColor, width: railLineWidth, lineDash: [5, 5] }),
            zIndex: 20000
          })
        );
      }
    }
    // 駅
    if (staCode && staCode !== 0) {
      styles.push(
        new Style({
          stroke: new Stroke({ color: railLineColor, width: 3 }),
          zIndex: 20000
        })
      );
    }
  }

  // 注記・記号
  if (layer === 'symbol') {
    const iconImage = getShowIcon(ftCode);
    if (ftCode && ![1401, 1402, 1403, 7101, 7102, 7103].includes(ftCode)) {
      // 記号一般
      if (iconImage) {
        styles.push(
          new Style({
            image: iconImage,
            zIndex: 100002
          })
        );
      }
    }

    // 都市名関係
    if (name || knj) {
      if (iconImage) {
        styles.push(
          new Style({
            text: new Text({
              text: name ?? knj ?? '',
              textAlign: 'left',
              offsetX: 8,
              offsetY: 0,
              fill: new Fill({ color: 'rgba(50,50,50,1)' }),
              stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
            }),
            image: iconImage,
            zIndex: 100004
          })
        );
      }
    }
  }

  // 標高関係
  if ((layer === 'symbol' || layer === 'elevation') && alti) {
    const iconImage = getShowIcon(ftCode);
    if (iconImage) {
      styles.push(
        new Style({
          text: new Text({
            text: String(Math.floor(alti * 10) / 10),
            textAlign: 'left',
            offsetX: 8,
            offsetY: 0,
            fill: new Fill({ color: 'rgba(50,50,50,1)' }),
            stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
          }),
          image: iconImage,
          zIndex: 100003 + (7105 - checkProp(ftCode, 0)) // 元コードのロジックを保持
        })
      );
    }
  }

  // 注記一般
  if ((layer === 'label' || layer === 'symbol') && knj) {
    styles.push(
      new Style({
        text: new Text({
          text: knj,
          fill: new Fill({ color: 'rgba(0,0,0,1)' }),
          stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
        }),
        zIndex: 100000
      })
    );
  }

  // 交通関係
  if (layer === 'transp' && knj) {
    styles.push(
      new Style({
        text: new Text({
          text: knj,
          fill: new Fill({ color: 'rgba(19,97,69,1)' }),
          stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
        }),
        zIndex: 100001
      })
    );
  }

  if (
    layer === 'label' &&
    knj &&
    annoCtg &&
    [422, 421, 411, 412, 413, 860, 441].includes(annoCtg)
  ) {
    styles.push(
      new Style({
        text: new Text({
          text: knj,
          fill: new Fill({ color: 'rgba(19,97,69,1)' }),
          stroke: new Stroke({ color: 'rgba(255,255,255,1)', width: 2 })
        }),
        zIndex: 100002
      })
    );
  }

  return styles;
};
