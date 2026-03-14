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

// 请求状态管理
interface RequestState {
  isRefreshingToken: boolean;
  failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    config: any;
  }>;
}

const requestState: RequestState = {
  isRefreshingToken: false,
  failedQueue: [],
};

/**
 * 处理失败的请求队列
 */
const processQueue = (error: Error | null, token: string | null = null): void => {
  while (requestState.failedQueue.length > 0) {
    const request = requestState.failedQueue.shift();
    if (request) {
      if (error) {
        request.reject(error);
      } else if (token) {
        // 使用新 token 重试
        const newConfig = {
          ...request.config,
          header: {
            ...request.config.header,
            'Authorization': `Bearer ${token}`,
          },
        };
        mpx.xfetch.fetch(newConfig)
          .then((res: any) => request.resolve(res))
          .catch((err: any) => request.reject(err));
      }
    }
  }
};

/**
 * 请求拦截器
 */
mpx.xfetch.interceptors.request.use(async (config) => {
  const { url = '', method = 'POST', header } = config;
  
  // 公共接口不需要 token
  const isPublic = PUBLIC_URLS.some(publicUrl => url.includes(publicUrl));
  
  if (isPublic) {
    return {
      ...config,
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      method,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
    };
  }

  // 获取 token（确保只有一个登录流程）
  const userStore = useUserStore();
  const token = await userStore.ensureToken();

  return {
    ...config,
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    method,
    header: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...header,
    },
  };
});

/**
 * 响应拦截器
 */
mpx.xfetch.interceptors.response.use(
  (res) => {
    // 开发环境日志
    if (info.miniProgram.envVersion !== 'release') {
      log.info(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
    }

    // 业务错误处理
    if (res.data?.error) {
      log.error(res.requestConfig ?? {}, res.statusCode || res.status, res.data ?? {});
      
      // 401 Token 过期处理
      if (res.status === 401 || res.statusCode === 401) {
        return handleTokenExpired(res);
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
  async (error) => {
    log.error('Network Error:', error);
    
    // 网络错误提示
    mpx.showToast({
      title: '网络异常，请检查网络连接',
      icon: 'none',
    });
    
    return Promise.reject(error);
  }
);

/**
 * 处理 Token 过期
 * - 将失败的请求加入队列
 * - 刷新 token
 * - 用新 token 重试队列中的请求
 */
async function handleTokenExpired(originalRes: any): Promise<any> {
  const originalConfig = originalRes.requestConfig;

  // 如果已经在刷新 token，将请求加入队列等待
  if (requestState.isRefreshingToken) {
    return new Promise((resolve, reject) => {
      requestState.failedQueue.push({
        resolve,
        reject,
        config: originalConfig,
      });
    });
  }

  requestState.isRefreshingToken = true;

  try {
    const userStore = useUserStore();
    
    // 刷新 token
    const newToken = await userStore.refreshToken();
    
    // 处理等待队列
    processQueue(null, newToken);
    
    // 重试原始请求
    const newConfig = {
      ...originalConfig,
      header: {
        ...originalConfig.header,
        'Authorization': `Bearer ${newToken}`,
      },
    };
    
    return mpx.xfetch.fetch(newConfig);
  } catch (refreshError) {
    // 刷新失败，清空队列并提示重新登录
    processQueue(refreshError as Error, null);
    
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
    
    return Promise.reject(new ApiError('UNAUTHORIZED', '登录已过期，请重新登录', 401));
  } finally {
    requestState.isRefreshingToken = false;
  }
}

export default mpx.xfetch;
