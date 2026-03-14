import mpx from '@mpxjs/core';
import { BASE_URL } from './request';
import { useUserStore } from '@/store/user';
import { log } from './log';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * 单文件上传
 * @param filePath 文件路径
 * @param options 上传选项
 * @returns 上传结果
 */
const uploadSingle = async (
  filePath: string, 
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const userStore = useUserStore();
  
  if (!userStore.token) {
    return { url: '', success: false, error: '未登录' };
  }

  try {
    const res = await mpx.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${userStore.token}`,
      },
    });

    const data = JSON.parse(res.data);
    
    if (data.data?.url) {
      return { url: data.data.url, success: true };
    }
    
    return { 
      url: '', 
      success: false, 
      error: data.error || '上传失败' 
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '上传异常';
    log.error('Upload error:', error);
    return { 
      url: '', 
      success: false, 
      error: errorMsg 
    };
  }
};

/**
 * 批量上传图片
 * @param filePaths 文件路径数组
 * @param options 上传选项
 * @returns 上传结果数组
 */
export const uploadImages = async (
  filePaths: string[], 
  options?: UploadOptions
): Promise<UploadResult[]> => {
  if (!filePaths.length) {
    return [];
  }

  const results = await Promise.all(
    filePaths.map(path => uploadSingle(path, options))
  );
  
  // 如果有失败的，显示提示
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    mpx.showToast({
      title: `${failures.length}张图片上传失败`,
      icon: 'none',
    });
  }
  
  return results;
};

/**
 * 带重试机制的上传
 * @param filePath 文件路径
 * @param maxRetries 最大重试次数
 * @returns 上传结果
 */
export const uploadWithRetry = async (
  filePath: string,
  maxRetries = 3
): Promise<UploadResult> => {
  let lastError: UploadResult = { url: '', success: false, error: '未知错误' };
  
  for (let i = 0; i < maxRetries; i++) {
    const result = await uploadSingle(filePath);
    if (result.success) {
      return result;
    }
    lastError = result;
    
    // 指数退避：1s, 2s, 4s
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  
  // 最终失败提示
  mpx.showToast({
    title: lastError.error || '上传失败，请重试',
    icon: 'none',
  });
  
  return lastError;
};

/**
 * 批量上传并返回成功上传的 URL 列表
 * @param filePaths 文件路径数组
 * @returns 成功上传的 URL 数组
 */
export const uploadImagesAndGetUrls = async (filePaths: string[]): Promise<string[]> => {
  const results = await uploadImages(filePaths);
  return results.filter(r => r.success).map(r => r.url);
};
