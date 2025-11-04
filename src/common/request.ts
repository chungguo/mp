import mpx from '@mpxjs/core';
import mpxFetch from '@mpxjs/fetch';
import { useUserStore } from '@/store/user';

export const BASE_URL = 'https://yesmilesh.com/api/v1';

mpx.use(mpxFetch);

mpx.xfetch.interceptors.request.use(async (config) => {
  const { url = '', method = "POST", header } = config;

  const userStore = useUserStore();

  await userStore.login();

  return {
    ...config,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    method,
    header: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userStore.token.value}`,
      ...header,
    },
  };
});


export default mpx.xfetch;
