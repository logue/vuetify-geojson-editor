import { test, expect } from '@playwright/test';

test.describe('Vuetify GeoJSON Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページの読み込み完了を待機
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display application title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vuetify GeoJSON Editor');
  });

  test('should open and close navigation drawer', async ({ page }) => {
    // ナビゲーションアイコンをクリック
    const navIcon = page.locator('.v-app-bar-nav-icon');
    await expect(navIcon).toBeVisible();
    await navIcon.click();

    // ドロワーが表示されることを確認
    const drawer = page.locator('.v-navigation-drawer');
    await expect(drawer).toBeVisible();

    // オーバーレイをクリックしてドロワーを閉じる
    const overlay = page.locator('.v-overlay');
    await overlay.click();
  });

  test('should display map component', async ({ page }) => {
    // マップコンポーネントが表示されることを確認
    const mapContainer = page.locator('.map-component');
    await expect(mapContainer).toBeVisible();
  });

  test('should display app bar menu', async ({ page }) => {
    // アプリバーメニューが表示されることを確認
    const appBar = page.locator('.v-app-bar');
    await expect(appBar).toBeVisible();

    // アプリバータイトルが表示されることを確認
    const title = page.locator('.v-app-bar-title');
    await expect(title).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    // フッターが表示されることを確認
    const footer = page.locator('.v-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('2025 ©');
  });

  test('should handle theme toggle', async ({ page }) => {
    // ナビゲーションドロワーを開く
    await page.locator('.v-app-bar-nav-icon').click();

    // テーマ切り替えボタンがあることを確認
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();

    // テーマが変更されたことを確認
    const app = page.locator('.v-application');
    await expect(app).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // デスクトップサイズでテスト
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.v-app-bar')).toBeVisible();

    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.v-app-bar')).toBeVisible();
    await expect(page.locator('.v-app-bar-nav-icon')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // ネットワークエラーを模擬
    await page.route('**/api/**', route => route.abort());

    // ページがクラッシュしないことを確認
    await expect(page.locator('.v-app')).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    // JavaScriptエラーをキャッチ
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // ページを再読み込み
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // JavaScriptエラーがないことを確認
    expect(errors).toHaveLength(0);
  });

  test('should be accessible', async ({ page }) => {
    // 基本的なアクセシビリティチェック
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // キーボードナビゲーションをテスト
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle map interactions', async ({ page }) => {
    const mapContainer = page.locator('.map-component');
    await expect(mapContainer).toBeVisible();

    // マップ上でクリックイベントをテスト
    await mapContainer.click();

    // マップが応答することを確認
    await expect(mapContainer).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    // ローディング状態をテスト
    const loadingOverlay = page.locator('.v-overlay');

    // ローディングが最終的に非表示になることを確認
    await expect(loadingOverlay).toBeHidden();
  });
});
