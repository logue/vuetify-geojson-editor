<script setup lang="ts">
/** ピンのプロパティモーダル. */
import { ref, watch, type Ref } from 'vue';

// CodeMirror
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from 'vue-codemirror6';
import { useTheme } from 'vuetify';

// Openlayers
import type FeatureProperties from '@/interfaces/FeatureProperties';
import type Feature from 'ol/Feature';

import { DefaultProperties } from '@/interfaces/FeatureProperties';
import { MaterialColors } from '@/types/MaterialColorType';

/* * 親コンポーネントに送信するイベントの定義 * /
interface PropertiesEditorEmit {
  /* * 保存 * /
  (e: 'submit', value: Feature<any> | undefined): void;
  /** 削除 * /
  (e: 'delete', value: Feature<any> | undefined): void;
}
*/

const emits = defineEmits(['submit', 'delete']);

/** vuetify */
const theme = useTheme();

/** モーダルの表示／非表示 */
const modal: Ref<boolean> = ref(false);

/** ピンの値 */
const properties: Ref<FeatureProperties> = ref(DefaultProperties);

/** 選択済みのピン */
const feature: Ref<Feature<any> | undefined> = ref();

/** タブ */
const tab: Ref<string> = ref('basic');

const isPoint: Ref<boolean> = ref(true);

/** モーダルを閉じたとき */
watch(modal, v => {
  // フォームを初期化
  if (!v) {
    feature.value = undefined;
    properties.value = DefaultProperties;
  }
});

/** 画面を開く */
const show = (f: Feature<any>) => {
  modal.value = true;
  feature.value = f;
  properties.value = f.getProperties() as FeatureProperties;
  isPoint.value = f.getGeometry().flatCoordinates.length === 2;
};

/** キャンセル */
const hide = () => {
  modal.value = false;
  properties.value = DefaultProperties;
};

/** 保存 */
const submit = () => {
  if (feature.value) {
    // 選択されているピンのプロパティを更新
    feature.value.setProperties(properties.value);
    // console.log(feature.value);
    emits('submit', feature.value);
  }
  // モーダルを閉じる
  modal.value = false;
};

/** 削除 */
const del = () => {
  emits('delete', feature.value);
  // モーダルを閉じる
  modal.value = false;
};

watch(modal, visibility => {
  if (!visibility) {
    tab.value = 'basic';
    properties.value.description = '';
  }
});

defineExpose({ show });
</script>

<template>
  <v-dialog v-model="modal" persistent max-width="1024px" @keydown.esc="hide">
    <v-card title="Edit Properties" subtitle="Edit the properties of the selected feature.">
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-text>
        <v-tabs v-model="tab">
          <v-tab value="basic" prepend-icon="mdi-information">Basic</v-tab>
          <v-tab value="description" prepend-icon="mdi-message-text">Description</v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item value="basic">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="properties.name"
                  label="name"
                  hint="The name that pops up when you click a feature."
                  prepend-icon="mdi-map-marker"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="properties.annotation"
                  label="Annotation"
                  hint="Text to display directly above the feature."
                  prepend-icon="mdi-form-textbox"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="properties.color"
                  :items="MaterialColors"
                  label="Feature Color"
                  prepend-icon="mdi-palette"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.title">
                      <template #prepend>
                        <v-icon :color="item.value">
                          mdi-checkbox-{{ item.value === properties.color ? 'marked' : 'blank' }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    <v-icon :color="item.value">mdi-checkbox-blank</v-icon>
                    {{ item.title }}
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model.number="properties.thickness"
                  label="Feature line thickness"
                  hint=" If set to 0, only annotations will be displayed."
                  type="number"
                  minimum="0"
                  prepend-icon="mdi-format-line-weight"
                  suffix="px"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="properties.annotationStyle"
                  label="Annotation Text style"
                  hint="Set font weight and font-size. Default is `500 0.75rem`."
                  placeholder="500 0.75rem"
                  prepend-icon="mdi-format-font"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model.number="properties.opacity"
                  label="Fill Opacity"
                  hint="Transparency of fills in Point and Polygons (0 to 1)"
                  type="number"
                  minimum="0"
                  maximum="1"
                  prepend-icon="mdi-opacity"
                  step="0.1"
                />
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item value="description">
            <v-input
              hint="The text to display in the popup. You can use Markdown notation."
              persistent-hint
            >
              <code-mirror
                v-model="properties.description"
                :lang="markdown()"
                :dark="theme.current.value.dark"
                gutter
                wrap
                basic
              />
            </v-input>
          </v-window-item>
        </v-window>
      </v-card-text>
      <v-card-actions>
        <v-btn color="red" variant="text" prepend-icon="mdi-delete" @click="del">Delate</v-btn>
        <v-spacer />
        <v-btn color="secondary" variant="text" prepend-icon="mdi-cancel" @click="hide">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="text" prepend-icon="mdi-check" @click="submit">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
