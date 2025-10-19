# Vuetify GeoJson Editor

A simple site for editing of geojson data.

## Powerd by

- [Vue3](https://vuejs.org)
- [Vuetify3](https://vuetifyjs.com)
- [Openlayers10](https://openlayers.org/)
- [Vue CodeMirror6](https://github.com/logue/vue-codemirror6).

## MapTiles

- [Openstreet Map](https://www.openstreetmap.org/)
- [国土地理院](https://www.gsi.go.jp/) - Include Vector

## Testing

このプロジェクトには包括的なテストスイートが含まれています：

### テストの種類

- **Unit Tests**: Vitest + Vue Test Utilsを使用
  - Pinaストアのテスト
  - Vue Composablesのテスト
  - ヘルパー関数のテスト
  - Vueコンポーネントのテスト

- **E2E Tests**: Playwrightを使用
  - ブラウザでの完全なユーザーワークフロー
  - レスポンシブデザインのテスト
  - アクセシビリティテスト

### テストの実行

```bash
# ユニットテストの実行
pnpm test:unit

# E2Eテストの実行
pnpm test:e2e

# すべてのテストの実行
pnpm test

# カバレッジ付きテスト実行
pnpm test:coverage
```

### テストファイル構造

```txt
src/
├── __tests__/                   # アプリケーション全体のテスト
│   ├── setup.ts                 # テスト環境の設定
│   └── App.spec.ts              # メインアプリコンポーネントのテスト
├── store/__tests__/             # Pinaストアのテスト
│   ├── ConfigStore.spec.ts
│   ├── GeoJsonEditorStore.spec.ts
│   ├── GlobalStore.spec.ts
│   └── MapCursorStore.spec.ts
├── composables/__tests__/       # Vue Composablesのテスト
│   └── useGeoJsonEditor.spec.ts
├── helpers/__tests__/           # ヘルパー関数のテスト
│   └── FeatureUtility.spec.ts
└── components/__tests__/        # 既存のコンポーネントテスト
    └── HelloWorld.spec.ts
e2e/                            # E2Eテスト
└── vue.spec.ts
```

### テスト環境

- OpenLayersライブラリの複雑なモック
- Vuetifyコンポーネントのテスト設定
- localStorageとブラウザAPIのモック
- TypeScript完全サポート

## LICENSE

©2025 by Logue.
Licensed under the [MIT License](LICENSE).
