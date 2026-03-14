import mpx from '@mpxjs/core';
import { log } from './log';

export interface ErrorOptions {
  showToast?: boolean;
  toastTitle?: string;
  report?: boolean;
}

/**
 * 统一错误处理
 * @param error 错误对象
 * @param options 处理选项
 */
export const handleError = (error: unknown, options: ErrorOptions = {}): void => {
  const {
    showToast = true,
    toastTitle = '操作失败，请重试',
    report = true,
  } = options;

  // 日志上报
  if (report) {
    if (error instanceof Error) {
      log.error(error.message, error.stack);
    } else {
      log.error('Unknown error:', error);
    }
  }

  // 用户提示
  if (showToast) {
    const message = error instanceof Error ? error.message : toastTitle;
    // 限制长度避免溢出
    const truncatedMessage = message.length > 20 ? message.slice(0, 20) + '...' : message;
    mpx.showToast({
      title: truncatedMessage,
      icon: 'none',
      duration: 2000,
    });
  }
};

/**
 * 包装异步函数，统一错误处理
 * @param fn 异步函数
 * @param options 错误处理选项
 * @returns 包装后的函数
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: ErrorOptions
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return undefined;
    }
  };
};

/**
 * 带加载状态的错误处理包装器
 * @param fn 异步函数
 * @param loadingText 加载提示文字
 * @returns 包装后的函数
 */
export const withLoading = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  loadingText = '加载中...'
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    mpx.showLoading({ title: loadingText });
    try {
      return await fn(...args);
    } finally {
      mpx.hideLoading();
    }
  };
};
