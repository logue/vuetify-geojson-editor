import DefaultStyle from './DefaultStyle';

/** 選択時のスタイル */
export default class SelectedStyle extends DefaultStyle {
  protected pointFillColor = this.colorSet.accent4 || this.colorSet.base;
  protected pointFillOpacity = 1;
  protected pointStrokeColor = this.colorSet.accent2 || this.colorSet.lighten4;
  protected pointStrokeOpacity = 1;
  protected pointStrokeWidth = 2;

  protected fillColor = this.colorSet.accent1 || this.colorSet.lighten5;
  protected fillOpacity = 0.5;
  protected strokeWidth = 3;

  protected textStrokeColor = this.colorSet.lighten5;
  protected textStrokeOpacity = 1;
}
