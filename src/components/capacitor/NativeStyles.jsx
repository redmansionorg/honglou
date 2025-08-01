// 用 JavaScript 动态添加原生应用样式
export function addNativeStyles() {
  if (typeof document === 'undefined') return;

  // 检查是否已经添加过样式
  if (document.getElementById('native-app-styles')) return;

  const style = document.createElement('style');
  style.id = 'native-app-styles';
  style.textContent = `
    /* Capacitor 原生应用样式 */
    
    /* 安全区域适配 */
    .native-app {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }

    .pt-safe-top {
      padding-top: env(safe-area-inset-top);
    }

    .pb-safe-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* 键盘弹出时的样式调整 */
    body.keyboard-open {
      height: calc(100vh - var(--keyboard-height, 0px));
    }

    /* iOS 特定样式 */
    .ios .native-app {
      -webkit-overflow-scrolling: touch;
    }

    /* 禁用文本选择和长按菜单（阅读体验优化） */
    .native-app .reading-content {
      -webkit-user-select: none;
      -webkit-callout: none;
      -webkit-touch-callout: none;
    }

    /* 原生应用状态栏适配 */
    .native-app header {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* 优化触摸体验 */
    .native-app button,
    .native-app .clickable {
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
    }

    /* 滚动优化 */
    .native-app {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    /* 启动屏幕背景色 */
    body.native-app {
      background-color: #fffbeb;
    }

    /* 导航栏适配 */
    .native-app .bottom-nav {
      padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
    }

    /* 阅读器安全区域 */
    .native-app .reader-header {
      padding-top: calc(env(safe-area-inset-top) + 0.75rem);
    }
  `;

  document.head.appendChild(style);
}

// 初始化函数
export function initializeNativeApp() {
  if (typeof window !== 'undefined') {
    // 添加样式
    addNativeStyles();
    
    // 设置启动屏幕背景
    document.body.style.backgroundColor = '#fffbeb';
  }
}