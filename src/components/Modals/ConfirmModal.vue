<script setup lang="ts">
/** 確認モーダル */
import { ref, type Ref } from 'vue';

/** プロップ */
withDefaults(
  defineProps<{
    /** ダイアログのタイトル */
    title: string;
    /** ダイアログのメッセージ */
    message?: string;
    /** 破棄ボタンを表示する */
    discardable?: boolean;
    /** 破壊的操作か（ボタンの位置を逆転させる） */
    danger?: boolean;
  }>(),
  {
    message: '',
    discardable: false,
    danger: false
  }
);
/** エミット */
const emit = defineEmits<{
  (e: 'submit', value: unknown): void;
  (e: 'cancel'): void;
  (e: 'discard', value: unknown): void;
}>();

/** モーダルの表示制御 */
const modal: Ref<boolean> = ref(false);

/** パラメータ */
const param: Ref<unknown> = ref(null);

/**
 * モーダルを開く
 *
 * @param arr - 何らかのパラメータ
 */
const show = (arr?: unknown) => {
  param.value = arr;
  modal.value = true;
};

/** モーダルを閉じる */
const hide = () => {
  emit('cancel');
  param.value = null;
  modal.value = false;
};

/** 破棄ボタンが押された */
const discard = () => {
  emit('discard', param.value);
  param.value = null;
  modal.value = false;
};

/** プライマリボタンが押された */
const submit = () => {
  emit('submit', param.value);
  hide();
};

defineExpose({ show });
</script>

<template>
  <v-dialog v-model="modal" max-width="640px" persistent @keydown.esc="hide">
    <v-card :title="title" :subtitle="message">
      <template #append>
        <v-tooltip text="Close">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-close" variant="plain" @click="hide" />
          </template>
        </v-tooltip>
      </template>
      <v-card-actions>
        <v-btn
          v-if="discardable"
          color="orange"
          prepend-icon="mdi-undo-variant"
          variant="plain"
          @click="discard"
        >
          Discard
        </v-btn>
        <v-spacer />
        <v-btn variant="text" color="secondary" prepend-icon="mdi-cancel" @click="hide">
          Cancel
        </v-btn>
        <v-btn
          :color="danger ? 'red' : 'primary'"
          variant="text"
          prepend-icon="mdi-check"
          @click="submit"
        >
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
