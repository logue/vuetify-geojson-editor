import { createPinia } from 'pinia';

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import useConfig from './ConfigStore';
import useGeoJsonEditor from './GeoJsonEditorStore';
import useGlobal from './GlobalStore';
import useLocationMarker from './LocationMarkerStore';
import useMapCursor from './MapCursorStore';

/** Pinia Store */
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
export default pinia;

export { useConfig, useGeoJsonEditor, useGlobal, useLocationMarker, useMapCursor };
