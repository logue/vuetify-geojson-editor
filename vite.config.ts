import { writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

import { visualizer } from 'rollup-plugin-visualizer';
import { checker } from 'vite-plugin-checker';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

import pkg from './package.json';

/**
 * Vite Configure
 *
 * @see {@link https://vitejs.dev/config/}
 */
export default defineConfig(({ command, mode }): UserConfig => {
  const config: UserConfig = {
    // https://vitejs.dev/config/shared-options.html#base
    base: '/vuetify-geojson-editor/',
    // https://vitejs.dev/config/shared-options.html#define
    define: { 'process.env': {} },
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
      minify: 'esbuild',
      // Rollup Options
      // https://vitejs.dev/config/build-options.html#build-rollupoptions
      rollupOptions: {
        output: {
          manualChunks: {
            // Split external library from transpiled code.
            vue: ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            vuetify: ['vuetify', 'vuetify/components', 'vuetify/directives', 'webfontloader'],
            openlayers: [
              'ol',
              'ol/control',
              'ol/format',
              'ol/interaction',
              'ol/interaction/Draw.js',
              'ol/interaction/Modify.js',
              'ol/interaction/Select.js',
              'ol/interaction/Snap.js',
              'ol/interaction/Translate.js',
              'ol/reproj.js',
              'ol/source',
              'ol/source/Vector.js',
              'ol/tilegrid.js',
              'ol/tilegrid',
              'ol/tileurlfunction.js',
              'ol-ext',
              'ol-ext/control/Button.js',
              'ol-ext/control/CanvasBase.js',
              'ol-ext/control/GridReference.js',
              'ol-ext/control/Notification.js',
              'ol-ext/control/Overlay.js',
              'ol-ext/control/ProgressBar.js',
              'ol-ext/control/Scale.js',
              'ol-ext/control/Toggle.js',
              'ol-ext/interaction/Delete.js',
              'ol-ext/interaction/DrawHole.js',
              'ol-ext/interaction/DrawRegular.js',
              'ol-ext/interaction/FillAttribute.js',
              'ol-ext/interaction/Hover.js',
              'ol-ext/interaction/ModifyTouch.js',
              'ol-ext/interaction/Transform.js',
              'ol-ext/interaction/UndoRedo.js',
              'ol-ext/geom/sphere.js',
              'ol-ext/overlay/Popup.js',
              'ol-ext/style/defaultStyle.js'
            ],
            codemirror: ['vue-codemirror6'],
            'codemirror-lang': [
              // Add the following as needed.
              '@codemirror/lang-json',
              '@codemirror/lang-markdown'
            ],
            misc: [
              '@turf/clean-coords',
              '@turf/rewind',
              'axios',
              'chroma-js',
              'es-toolkit',
              'geojson-precision-ts',
              'streamsaver/StreamSaver.js',
              'topojson-client',
              'topojson-server',
              'uuid'
            ]
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
    },
    esbuild: {
      // Drop console when production build.
      drop: command === 'serve' ? [] : ['console']
    }
  };

  // Write meta data.
  writeFileSync(
    fileURLToPath(new URL('./src/Meta.ts', import.meta.url)),

    `import type MetaInterface from '@/interfaces/MetaInterface';

// This file is auto-generated by the build system.
const meta: MetaInterface = {
  version: '${pkg.version}',
  date: '${new Date().toISOString()}',
};
export default meta;
`
  );

  return config;
});
