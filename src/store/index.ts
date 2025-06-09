import { createPinia } from 'pinia';

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import useConfigStore from './ConfigStore';
import useGeoJsonEditorStore from './GeoJsonEditorStore';
import useGlobalStore from './GlobalStore';
import useMapCursorStore from './MapCursorStore';

/** Pinia Store */
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
export default pinia;

export { useConfigStore, useGeoJsonEditorStore, useGlobalStore, useMapCursorStore };
