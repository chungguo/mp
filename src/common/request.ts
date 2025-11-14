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

mpx.xfetch.interceptors.response.use((res) => {
  if (res.data.error) {
    wx.showModal({
      title: '提示',
      content: res.data.details || res.data.error,
      showCancel: false,
    });
    return Promise.reject(res);
  }

  if (!isNaN(res.status) && (res.status < 200 || res.status >= 300)) {
    wx.showModal({
      title: '提示',
      content: res.data || '系统异常，请稍候再试～',
      showCancel: false,
    });
    return Promise.reject(res);
  }

  return res;
});


export default mpx.xfetch;
