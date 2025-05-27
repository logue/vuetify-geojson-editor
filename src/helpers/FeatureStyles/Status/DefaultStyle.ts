import AbstractStyle from '../AbstractFeatureStyle';

/** デフォルトのスタイル */
export default class DefaultStyle extends AbstractStyle {
  protected pointFillColor = this.colorSet.accent1 || this.colorSet.lighten4;
  protected pointFillOpacity = 0.35;
  protected pointStrokeColor = this.colorSet.accent3 || this.colorSet.lighten3;
  protected pointStrokeOpacity = 1;
  protected pointStrokeWidth = 1;
  protected pointSize = 5;
  protected pointTextStyle = `400 0.3rem ${this.fontFace}`;
  protected fillColor = this.colorSet.accent1 || this.colorSet.lighten4;
  protected fillOpacity = 0.25;
  protected strokeColor = this.colorSet.accent3 || this.colorSet.lighten3;
  protected strokeOpacity = 0.75;
  protected strokeWidth = 1;
  protected textColor = this.colorSet.darken4;
  protected textStyle = `600 1rem ${this.fontFace}`;
  protected textOpacity = 1;
  protected textStrokeColor = this.colorSet.lighten5;
  protected textStrokeOpacity = 0.5;
  protected textStrokeWidth = 2.5;
  protected iconOpacity = 1;
  protected iconTextStyle = `500 0.75rem ${this.fontFace}`;
  protected gridColor = this.colorSet.base;
  protected gridOpacity = 0.5;
  protected gridTextStyle = `900 1.5rem ${this.fontFace}`;
}
