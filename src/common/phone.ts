import mpx from "@mpxjs/core";
import request from "./request";

export const getPhoneNumber = async (e: WechatMiniprogram.ButtonGetPhoneNumber) => {
  if (!e.detail.code) {
    mpx.showModal({
      title: '获取授权失败',
      content: e.detail.errMsg,
      showCancel: false,
      confirmText: '知道了',
    });
    return;
  }

  mpx.showLoading({
    title: '获取授权中...',
  });

  try {
    const resp = await request.fetch<{
      data: { phone_number: string }
    }>({
      url: '/auth/phone',
      data: {
        code: e.detail.code,
      },
    });

    const phone = resp.data?.data?.phone_number;

    if (!phone) {
      mpx.showToast({
        icon: 'error',
        title: '获取授权失败',
      });
      return;
    }

    return phone;
  } catch (e) {
    mpx.showToast({
      title: '获取授权失败',
      icon: 'error',
    });
  } finally {
    mpx.hideLoading();
  }
}
