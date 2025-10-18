/** マテリアルカラー型 */
export type MaterialColorType =
  | 'red'
  | 'pink'
  | 'purple'
  | 'deep-purple'
  | 'indigo'
  | 'blue'
  | 'light-blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'light-green'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'deep-orange'
  | 'brown'
  | 'grey'
  | 'blue-grey';

/** マテリアルカラーの選択肢 */
export const MaterialColors: MaterialColorType[] = [
  'red',
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue',
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deep-orange',
  'brown',
  'blue-grey',
  'grey'
];

export type MaterialColorSet = {
  base: string;
  lighten5: string;
  lighten4: string;
  lighten3: string;
  lighten2: string;
  lighten1: string;
  darken1: string;
  darken2: string;
  darken3: string;
  darken4: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
};
