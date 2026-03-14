import mpx from '@mpxjs/core';

/**
 * 简单的错误提示
 * 长错误信息使用 Modal 显示，确保用户能看到完整信息
 */
export const showErrorModal = (title: string, content?: string): void => {
  mpx.showModal({
    title: title || '提示',
    content: content || '操作失败，请重试',
    showCancel: false,
  });
};

/**
 * 显示成功提示
 */
export const showSuccess = (message: string, duration = 1500): void => {
  mpx.showToast({
    title: message.slice(0, 20),
    icon: 'success',
    duration,
  });
};
