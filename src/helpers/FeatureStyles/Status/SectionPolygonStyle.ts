import DefaultStyle from './DefaultStyle';

/** セクションのポリゴンのスタイル */
export default class SectionPolygonStyle extends DefaultStyle {
  protected fillOpacity = 0;
  protected textStrokeOpacity = 0.75;
  protected textStyle = `600 1.5rem ${this.fontFace}`;
}
