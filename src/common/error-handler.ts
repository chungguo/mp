import mpx from '@mpxjs/core';
import { log } from './log';

export interface ErrorOptions {
  showToast?: boolean;
  toastTitle?: string;
  report?: boolean;
  useModalForLongError?: boolean; // 长错误是否使用 Modal 显示
  maxToastLength?: number; // 自定义 Toast 最大长度
}

// 错误消息长度阈值
const ERROR_LENGTH_THRESHOLD = {
  SHORT: 20,   // 短错误，直接显示
  MEDIUM: 50,  // 中等错误，截断显示
  LONG: 100,   // 长错误，使用友好提示
};

// 常见后端错误映射（简化提示）
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Invalid token': '登录已过期',
  'Unauthorized': '请先登录',
  'Forbidden': '没有权限',
  'Not Found': '数据不存在',
  'Internal Server Error': '服务器繁忙',
  'Bad Request': '请求参数错误',
  'Request timeout': '请求超时',
  'Network Error': '网络连接失败',
  'timeout of ': '请求超时，请重试',
};

/**
 * 简化错误消息
 * 将后端长错误转换为友好短提示
 */
const simplifyErrorMessage = (message: string): string => {
  // 1. 检查已知错误映射
  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 2. 提取关键信息（如 JSON 中的 message 字段）
  try {
    const jsonMatch = message.match(/"message"\s*:\s*"([^"]+)"/);
    if (jsonMatch && jsonMatch[1]) {
      return simplifyErrorMessage(jsonMatch[1]); // 递归简化
    }
  } catch {
    // 不是 JSON，继续处理
  }

  // 3. 按长度处理
  if (message.length <= ERROR_LENGTH_THRESHOLD.SHORT) {
    return message;
  }

  if (message.length <= ERROR_LENGTH_THRESHOLD.MEDIUM) {
    return message.slice(0, ERROR_LENGTH_THRESHOLD.SHORT) + '...';
  }

  // 4. 长错误返回友好提示
  return '操作失败，请重试';
};

/**
 * 截断消息到指定长度
 */
const truncateMessage = (message: string, maxLength: number): string => {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 3) + '...';
};

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
    useModalForLongError = false,
    maxToastLength = 20,
  } = options;

  // 获取错误消息
  const rawMessage = error instanceof Error ? error.message : toastTitle;
  
  // 简化错误消息（用于 Toast 显示）
  const simplifiedMessage = simplifyErrorMessage(rawMessage);
  
  // 截断到 Toast 限制长度
  const toastMessage = truncateMessage(simplifiedMessage, maxToastLength);

  // 日志上报（记录完整错误）
  if (report) {
    if (error instanceof Error) {
      log.error('Error:', {
        message: rawMessage,
        stack: error.stack,
        simplified: simplifiedMessage,
        toast: toastMessage,
      });
    } else {
      log.error('Unknown error:', error);
    }
  }

  // 用户提示
  if (showToast) {
    const isLongError = rawMessage.length > ERROR_LENGTH_THRESHOLD.MEDIUM;
    
    // 长错误且启用 Modal 时，使用 Modal 显示
    if (isLongError && useModalForLongError) {
      mpx.showModal({
        title: '提示',
        content: truncateMessage(rawMessage, 100), // Modal 内容也限制长度
        showCancel: false,
      });
    } else {
      // 使用 Toast 显示简化后的消息
      mpx.showToast({
        title: toastMessage,
        icon: 'none',
        duration: 2000,
      });
    }
  }
};

/**
 * 显示成功提示
 * @param message 成功消息
 * @param duration 显示时长（毫秒）
 */
export const showSuccess = (message: string, duration = 1500): void => {
  const truncated = truncateMessage(message, 20);
  mpx.showToast({
    title: truncated,
    icon: 'success',
    duration,
  });
};

/**
 * 显示错误提示（简短版）
 * @param message 错误消息
 * @param duration 显示时长（毫秒）
 */
export const showError = (message: string, duration = 2000): void => {
  const simplified = simplifyErrorMessage(message);
  const truncated = truncateMessage(simplified, 20);
  mpx.showToast({
    title: truncated,
    icon: 'none',
    duration,
  });
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
