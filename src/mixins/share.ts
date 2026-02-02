import mpx from '@mpxjs/core';

// 全局分享 mixin - 自动混入到所有页面
mpx.mixin({
  onShareAppMessage() {
    return {
      title: '健牙宝，上海7家口腔医院官方合作平台',
      path: '/pages/index',
      imageUrl: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/share.jpg',
    };
  },
  onShareTimeline() {
    return {
      title: '健牙宝，上海7家口腔医院官方合作平台',
      query: '',
      imageUrl: 'https://yjb-1376872341.cos.ap-shanghai.myqcloud.com/public/share.jpg',
    };
  },
});
