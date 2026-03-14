import mpx from '@mpxjs/core';
import mpxFetch from '@mpxjs/fetch';
import { tokenManager } from '@/store/user';
import { log } from './log';
import { handleError } from './error-handler';
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

/**
 * 请求队列管理
 * 处理 401 Token 过期后的请求重试
 */
interface QueuedRequest {
  config: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestQueueManager {
  private isRefreshing = false;
  private queue: QueuedRequest[] = [];

  /**
   * 添加请求到队列
   */
  enqueue(config: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject });
    });
  }

  /**
   * 处理队列（Token 刷新成功后调用）
   */
  async processQueue(token: string): Promise<void> {
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        try {
          const newConfig = {
            ...request.config,
            header: {
              ...request.config.header,
              'Authorization': `Bearer ${token}`,
            },
          };
          const res = await mpx.xfetch.fetch(newConfig);
          request.resolve(res);
        } catch (error) {
          request.reject(error);
        }
      }
    }
  }

  /**
   * 清空队列（Token 刷新失败时）
   */
  clearQueue(error: Error): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      request?.reject(error);
    }
  }

  get isRefreshingToken(): boolean {
    return this.isRefreshing;
  }

  set refreshing(value: boolean) {
    this.isRefreshing = value;
  }
}

const requestQueue = new RequestQueueManager();

/**
 * 请求拦截器
 * 核心逻辑：
 * 1. 公共接口跳过 Token
 * 2. 调用 ensureToken() 获取有效 Token（自动处理并发）
 * 3. Token 自动附加到请求头
 */
mpx.xfetch.interceptors.request.use(async (config) => {
  const { url = '', method = 'POST', header } = config;
  
  // 1. 公共接口不需要 Token
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

  // 2. 获取有效 Token（关键：ensureToken 内部处理了并发）
  const token = await tokenManager.getToken();

  // 3. 组装请求配置
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
 * 核心逻辑：
 * 1. 开发环境日志
 * 2. 401 Token 过期处理
 * 3. 业务错误统一处理
 * 4. HTTP 错误处理
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
      
      const errorMessage = res.data.details || res.data.error;
      const apiError = new ApiError(res.data.error, errorMessage, res.status);
      
      // 401 Token 过期特殊处理
      if (res.status === 401 || res.statusCode === 401) {
        return handleTokenExpired(res, apiError);
      }
      
      // 其他业务错误提示
      handleError(apiError, { showToast: true, report: false });
      return Promise.reject(apiError);
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
    handleError(error, { showToast: true });
    return Promise.reject(error);
  }
);

/**
 * 处理 Token 过期（401）
 * 
 * 流程：
 * 1. 将当前失败请求加入队列
 * 2. 刷新 Token（全局唯一）
 * 3. 用新 Token 重试队列中的所有请求
 * 4. 如果刷新失败，清空队列并提示重新登录
 */
async function handleTokenExpired(
  originalRes: any, 
  apiError: ApiError
): Promise<any> {
  const originalConfig = originalRes.requestConfig;

  // 已经在刷新中，加入队列等待
  if (requestQueue.isRefreshingToken) {
    return requestQueue.enqueue(originalConfig);
  }

  requestQueue.refreshing = true;

  try {
    // 刷新 Token（会触发重新登录）
    const newToken = await tokenManager.getToken();
    
    // 处理队列中的请求
    await requestQueue.processQueue(newToken);
    
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
    // 刷新失败，清空队列
    requestQueue.clearQueue(refreshError as Error);
    
    // 提示重新登录
    mpx.showModal({
      title: '登录已过期',
      content: '您的登录状态已过期，请重新登录',
      showCancel: false,
      complete: () => {
        mpx.restartMiniProgram({ path: '/pages/index' });
      },
    });
    
    return Promise.reject(apiError);
  } finally {
    requestQueue.refreshing = false;
  }
}

export default mpx.xfetch;
