import mpx from '@mpxjs/core';
import mpxFetch from '@mpxjs/fetch';
import { useUserStore } from '@/store/user';
import { log } from './log';

export const BASE_URL = 'https://yesmilesh.com/api/v1';

mpx.use(mpxFetch);

const info = mpx.getAccountInfoSync();

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
      'Authorization': `Bearer ${userStore.token}`,
      ...header,
    },
  };
});

mpx.xfetch.interceptors.response.use((res) => {
  if (info.miniProgram.envVersion !== 'release') {
    log.info(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
  }

  if (res.data.error) {
    log.error(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});

    mpx.showModal({
      title: '提示',
      content: res.data.details || res.data.error,
      showCancel: false,
      usePromise: false,
      success: (r) => {
        if (r.confirm && res.status === 401 && res.data.error === 'Invalid token') {
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          const path = `/${currentPage.route}`;
          mpx.restartMiniProgram({
            path,
          });
        }
      },
    });
    return Promise.reject(res);
  }

  if (!isNaN(res.status) && (res.status < 200 || res.status >= 300)) {
    log.error(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
    mpx.showModal({
      title: '提示',
      content: res.data || '系统异常，请稍候再试～',
      showCancel: false,
    });
    return Promise.reject(res);
  }

  return res;
});


export default mpx.xfetch;
