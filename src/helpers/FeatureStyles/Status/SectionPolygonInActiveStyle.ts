import SectionPolygonStyle from './SectionPolygonStyle';

/** セクションのポリゴンのスタイル */
export default class SectionPolygonInActiveStyle extends SectionPolygonStyle {
  protected fillOpacity = 0;
  protected strokeOpacity = 0.25;
  protected textOpacity = 0.5;
  protected textStrokeOpacity = 0.25;
}
