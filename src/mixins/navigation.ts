import mpx from '@mpxjs/core'

// 全局导航 mixin - 自动混入到所有页面和组件
mpx.mixin({
  methods: {
    /**
     * 安全返回上一页，如果失败则导航到指定页面
     * @param fallbackPath 当navigateBack失败时的fallback路径
     */
    safeNavigateBack(fallbackPath: string = ''): void {
      mpx.navigateBack({
        usePromise: false,
        fail: () => {
          mpx.navigateTo({
            url: fallbackPath,
            usePromise: false,
            fail: () => {
              mpx.switchTab({
                url: fallbackPath,
                usePromise: false,
                fail: () => {
                  // 如果连fallback都失败了，就重定向到首页
                  mpx.reLaunch({
                    url: '/pages/index'
                  })
                }
              })
            }
          })
        }
      })
    }
  }
})
