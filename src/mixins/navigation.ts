import mpx from '@mpxjs/core'

// tabBar 页面列表
const TAB_BAR_PAGES = ['/pages/index', '/pages/aitest/index', '/pages/me/index']

// 全局导航 mixin - 自动混入到所有页面和组件
mpx.mixin({
  methods: {
    /**
     * 安全返回上一页，如果失败则导航到指定页面
     * @param fallbackPath 当navigateBack失败时的fallback路径
     */
    safeNavigateBack(fallbackPath: string = ''): void {
      const pages = getCurrentPages()

      // 如果页面栈只有1页，无法返回
      if (pages.length <= 1) {
        // 如果有 fallback 路径
        if (fallbackPath) {
          // 判断是否为 tabBar 页面
          if (TAB_BAR_PAGES.includes(fallbackPath)) {
            mpx.switchTab({ url: fallbackPath })
          } else {
            // 非 tabBar 页面使用 reLaunch，避免页面栈问题
            mpx.reLaunch({ url: fallbackPath })
          }
        } else {
          // 没有 fallback，返回首页
          mpx.switchTab({ url: '/pages/index' })
        }
        return
      }

      // 正常返回上一页
      mpx.navigateBack({
        usePromise: false,
        fail: () => {
          if (fallbackPath) {
            if (TAB_BAR_PAGES.includes(fallbackPath)) {
              mpx.switchTab({ url: fallbackPath })
            } else {
              mpx.reLaunch({ url: fallbackPath })
            }
          } else {
            mpx.switchTab({ url: '/pages/index' })
          }
        }
      })
    }
  }
})
