import DefaultStyle from './DefaultStyle';

/** 非アクティブ時のスタイル */
export default class InActiveStyle extends DefaultStyle {
  protected pointFillOpacity = 0.05;
  protected pointStrokeOpacity = 0.25;
  protected fillOpacity = 0.05;
  protected strokeOpacity = 0.25;
  protected iconOpacity = 0.5;
  protected textOpacity = 0.5;
  protected textStrokeOpacity = 0.25;
}
