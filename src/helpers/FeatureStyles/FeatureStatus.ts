/** ピンの状態型定義 */
const FeatureStatus = {
  /** アクティブ */
  ACTIVE: 'active',
  /** 非アクティブ（別レイヤーなど） */
  INACTIVE: 'inactive',
  /** ホバー時 */
  HOVER: 'hover',
  /** 選択時 */
  SELECTED: 'selected'
} as const;

/** ピンの状態型 */
export type FeatureStatusType = (typeof FeatureStatus)[keyof typeof FeatureStatus];

/** ピンの状態 */
export default FeatureStatus;
