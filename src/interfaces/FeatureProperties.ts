import type { MaterialColorType } from '@/types/MaterialColorType';

/** マーカー情報 */
export default interface FeatureProperties {
  /**
   * 一意の識別子
   * 主に翻訳のキーで使用するので重複していても良い。
   */
  id?: string;
  /** セクション */
  section?: string;
  /**
   * ロケーション名
   * 吹き出しのタイトルで表示されるテキスト
   * （NgsTools内部ではここの値は使用しない。idをキーに翻訳して上書きする）
   */
  name?: string;
  /** 吹き出しの中身（原則Markdown） */
  description?: string;
  /**
   * 注釈
   * 地図上のピンやポリゴンに直接表示するテキスト。 アイコンの場合下に表示
   */
  annotation?: string | number;
  /**
   * 注釈の文字サイス
   * （単位はrem。アイコンの場合は無視されます）
   */
  annotationStyle?: string;
  /**
   * ピンの使用アイコン
   * Pointの場合のみ有効。
   */
  icon?: string;
  /**
   * ピン、ポリゴン、表示される吹き出しの色
   * アイコン指定時は無視される。Material Colorの16色が使えます。
   */
  color: MaterialColorType;
  /** ピン、ポリゴン内の塗りつぶしの量（0～1） */
  opacity?: number;
  /**
   * 線の太さ
   * 0にすると注釈のみ表示されます。アイコンの場合は無視されます。
   */
  thickness?: number;
  /** レイヤーの階層レベル */
  level: number;
}

export const DefaultProperties: FeatureProperties = {
  id: undefined,
  name: undefined,
  description: undefined,
  annotation: undefined,
  annotationStyle: undefined,
  icon: undefined,
  color: 'light-blue',
  opacity: undefined,
  thickness: undefined,
  level: 0
};
