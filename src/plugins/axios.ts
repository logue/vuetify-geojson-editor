import { useGlobal } from '@/store';

import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

axios.defaults.withCredentials = true;
axios.defaults.onUploadProgress = (progressEvent): void => {
  const globalStore = useGlobal();
  if (progressEvent.progress && progressEvent.total) {
    globalStore.setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
  } else {
    globalStore.setProgress(null);
  }
};

axios.defaults.onDownloadProgress = (progressEvent): void => {
  const globalStore = useGlobal();
  if (progressEvent.progress && progressEvent.total) {
    globalStore.setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
  } else {
    globalStore.setProgress(null);
  }
};

axios.interceptors.request.use(request => {
  const globalStore = useGlobal();
  globalStore.setLoading(true);
  return request;
});
axios.interceptors.response.use(
  response => {
    const globalStore = useGlobal();
    globalStore.setLoading(false);
    return response;
  },
  error => {
    const globalStore = useGlobal();
    globalStore.setLoading(false);
    if (error.response.status >= 400) {
      globalStore.setMessage('不明なエラーが発生しました。');
      throw new Error(error);
    }
    console.error(error.response.data);
    return error.response;
  }
);

export default axios;
