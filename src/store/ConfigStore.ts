import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

/** Config Store */
export default defineStore(
  'config',
  () => {
    /** Dark Theme mode */
    const theme: Ref<boolean> = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
    /** Language */
    const locale: Ref<string> = ref(window.navigator.languages[0] ?? window.navigator.language);
    /** Fullscreen */
    const fullscreen: Ref<boolean> = ref(false);
    /** Show number to feature */
    const featureNumberVisibility: Ref<boolean> = ref(false);

    /** Toggle Dark/Light mode */
    function toggleTheme() {
      theme.value = !theme.value;
    }
    /** Toggle Fullscreen */
    function toggleFullscreen() {
      fullscreen.value = !fullscreen.value;
    }
    /** Set Locale. */
    function setLocale(l: string) {
      locale.value = l;
    }
    /** Set visibility feature to number */
    function toggleFeatureNumberVisibility() {
      featureNumberVisibility.value = !featureNumberVisibility.value;
    }

    return {
      theme,
      featureNumberVisibility,
      toggleTheme,
      toggleFullscreen,
      setLocale,
      toggleFeatureNumberVisibility
    };
  },
  {
    // Data persistence destination
    persist: {
      storage: window.localStorage
    }
  }
);
