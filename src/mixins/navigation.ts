import mpx from '@mpxjs/core'

export default {
  methods: {
    /**
     * 安全返回上一页，如果失败则导航到指定页面
     * @param fallbackPath 当navigateBack失败时的fallback路径
     */
    safeNavigateBack(fallbackPath: string = ''): void {
      mpx.navigateBack({
        fail: () => {
          mpx.navigateTo({
            url: fallbackPath,
            fail: () => {
              mpx.switchTab({
                url: fallbackPath,
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
}
