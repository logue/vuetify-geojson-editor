import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

import { visualizer } from 'rollup-plugin-visualizer';
import { checker } from 'vite-plugin-checker';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  name: string;
  version: string;
};

/**
 * Vite Configure
 *
 * @see {@link https://vitejs.dev/config/}
 */
export default defineConfig(({ mode }): UserConfig => {
  const buildDate = new Date().toISOString();

  const config: UserConfig = {
    // https://vitejs.dev/config/shared-options.html#base
    base: '/vuetify-geojson-editor/',
    // https://vitejs.dev/config/shared-options.html#define
    define: {
      'process.env': {},
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(buildDate)
    },
    plugins: [
      // Vue3
      vue({
        template: {
          // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin#image-loading
          transformAssetUrls
        }
      }),
      vueDevTools(),
      // Vuetify Loader
      // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin
      vuetify({
        autoImport: true,
        styles: { configFile: 'src/styles/settings.scss' }
      }),
      // vite-plugin-checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({
        typescript: true
        // vueTsc: true,
        // eslint: { lintCommand: 'eslint' },
        // stylelint: { lintCommand: 'stylelint' },
      })
    ],
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./node_modules', import.meta.url))
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
    },
    // Build Options
    // https://vitejs.dev/config/build-options.html
    build: {
      // Build Target
      // https://vitejs.dev/config/build-options.html#build-target
      target: 'esnext',
      // Minify option
      // https://vitejs.dev/config/build-options.html#build-minify
      minify: 'oxc',
      // Rollup Options
      // https://vitejs.dev/config/build-options.html#build-rollupoptions
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // Split external library from transpiled code.
            if (
              id.includes('/node_modules/vuetify') ||
              id.includes('/node_modules/webfontloader') ||
              id.includes('/node_modules/@mdi/font')
            ) {
              // VueよりもVuetifyの方が大きいので、vuetifyを先に分割する
              return 'vuetify';
            }
            if (
              id.includes('/node_modules/@vue/') ||
              id.includes('/node_modules/vue') ||
              id.includes('/node_modules/pinia') ||
              id.includes('/node_modules/destr/') || // pinia-plugin-persistedstate uses destr.
              id.includes('/node_modules/deep-pick-omit/') // pinia-plugin-persistedstate uses deep-pick-omit.
            ) {
              // VueとPiniaをまとめる
              return 'vue';
            }
            // OpenLayersとol-ext
            if (id.includes('/node_modules/ol/')) {
              return 'ol';
            }
            if (id.includes('/node_modules/ol-ext/')) {
              return 'ol-ext';
            }
            // CodeMirror6
            if (
              id.includes('/node_modules/vue-codemirror6/') ||
              id.includes('/node_modules/codemirror/') ||
              id.includes('/node_modules/@codemirror/') ||
              id.includes('/node_modules/style-mod/')
            ) {
              return 'codemirror';
            }
            if (id.includes('/node_modules/@lezer/')) {
              return 'lezer';
            }
            // その他のnode_modules内のパッケージを'vendor'にまとめる
            if (id.includes('/node_modules/')) {
              return 'vendor';
            }
          },
          plugins: [
            mode === 'analyze'
              ? // rollup-plugin-visualizer
              // https://github.com/btd/rollup-plugin-visualizer
              visualizer({
                open: true,
                filename: 'dist/stats.html'
              })
              : undefined
          ]
        }
      }
    }
  };

  return config;
});
