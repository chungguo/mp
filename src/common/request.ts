import mpx from '@mpxjs/core';
import mpxFetch from '@mpxjs/fetch';
import { useUserStore } from '@/store/user';
import { log } from './log';
import { APP_CONFIG } from '@/constants';

export const BASE_URL = APP_CONFIG.baseUrl;

mpx.use(mpxFetch);

const info = mpx.getAccountInfoSync();

// 不需要登录的接口白名单
const PUBLIC_URLS = ['/auth/login', '/auth/register'];

// 自定义错误类
export class ApiError extends Error {
  constructor(
    public code: string,
    public details?: string,
    public status?: number
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export class HttpError extends Error {
  constructor(public status: number, public data?: any) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

// 全局 401 处理状态，防止重复弹窗
let isHandling401 = false;

mpx.xfetch.interceptors.request.use(async (config) => {
  const { url = '', method = 'POST', header } = config;
  
  // 只在需要时获取 token
  const isPublic = PUBLIC_URLS.some(publicUrl => url.includes(publicUrl));
  let token = '';
  
  if (!isPublic) {
    const userStore = useUserStore();
    token = await userStore.ensureToken();
  }

  return {
    ...config,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    method,
    header: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...header,
    },
  };
});

mpx.xfetch.interceptors.response.use(
  (res) => {
    // 开发环境日志
    if (info.miniProgram.envVersion !== 'release') {
      log.info(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
    }

    // 业务错误处理
    if (res.data?.error) {
      log.error(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
      
      // 401 特殊处理：token 失效
      if (res.status === 401 || res.statusCode === 401) {
        if (!isHandling401) {
          isHandling401 = true;
          const userStore = useUserStore();
          userStore.logout();
          
          mpx.showModal({
            title: '登录已过期',
            content: '您的登录状态已过期，请重新登录',
            showCancel: false,
            complete: () => {
              mpx.restartMiniProgram({
                path: '/pages/index',
              });
            },
          });
        }
        return Promise.reject(new ApiError('UNAUTHORIZED', '登录已过期', 401));
      }
      
      // 其他业务错误使用轻量级提示
      mpx.showToast({
        title: res.data.details || res.data.error,
        icon: 'none',
        duration: 2000,
      });
      
      return Promise.reject(new ApiError(res.data.error, res.data.details, res.status));
    }

    // HTTP 错误处理
    if (!isNaN(res.status) && (res.status < 200 || res.status >= 300)) {
      log.error(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
      return Promise.reject(new HttpError(res.status, res.data));
    }

    return res;
  },
  (error) => {
    log.error('Network Error:', error);
    mpx.showToast({
      title: '网络异常，请检查网络连接',
      icon: 'none',
    });
    return Promise.reject(error);
  }
);

export default mpx.xfetch;
