import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

/** Config Store */
export default defineStore(
  'config',
  () => {
    /** Dark Theme mode */
    const theme: Ref<boolean> = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
    /** Toggle Dark/Light mode */
    function toggleTheme() {
      theme.value = !theme.value;
    }

    return {
      theme,
      toggleTheme
    };
  },
  {
    // Data persistence destination
    persist: {
      storage: window.localStorage
    }
  }
);
