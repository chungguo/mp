import mpx from '@mpxjs/core'

export const updateManager = () => {
  if (!mpx.canIUse('getUpdateManager')) {
    return;
  }

  const updateManager = mpx.getUpdateManager();

  updateManager.onUpdateReady(() => {
    mpx.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success(res) {
        if (res.confirm) {
          updateManager.applyUpdate();
        }
      },
    });
  });
};
