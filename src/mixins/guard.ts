
import mpx from '@mpxjs/core';
import { useUserStore } from '@/store/user';

export default {
  async onLoad() {
    const userStore = useUserStore();

    if (!userStore.profile) {
      await userStore.queryProfile();
    }

    // 检查phone字段是否有值
    if (!userStore.profile?.phone) {
      // 跳转到微信授权手机号页面
      mpx.navigateTo({
        url: '/pages/auth/phone'
      });
    }
  }
}
