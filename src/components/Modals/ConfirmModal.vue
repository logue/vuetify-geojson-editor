<script setup lang="ts">
/** 確認モーダル */
import { ref, type Ref } from 'vue';

/** プロップ */
defineProps({
  /** ダイアログのタイトル */
  title: { type: String, required: true },
  /** ダイアログのメッセージ */
  message: { type: String, default: '' },
  /** 破棄ボタンを表示する */
  discardable: { type: Boolean, default: false },
  /** 破壊的操作か（ボタンの位置を逆転させる） */
  danger: { type: Boolean, default: false }
});
/** エミット */
const emit = defineEmits(['submit', 'cancel', 'discard']);

/** モーダルの表示制御 */
const modal: Ref<boolean> = ref(false);

/** パラメータ */
const param: Ref<any> = ref(null);

/**
 * モーダルを開く
 *
 * @param arr - 何らかのパラメータ
 */
const show = (arr?: any) => {
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
  <v-dialog v-model="modal" persistent max-width="640px" @keydown.esc="hide">
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
          variant="text"
          :color="danger ? 'red' : 'primary'"
          prepend-icon="mdi-check"
          @click="submit"
        >
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
