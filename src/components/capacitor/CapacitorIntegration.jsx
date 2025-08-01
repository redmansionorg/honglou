export class CapacitorIntegration {
  static async initialize() {
    if (typeof window !== 'undefined' && window.Capacitor) {
      try {
        // 检查是否在原生环境中
        const isNative = window.Capacitor.isNativePlatform();
        
        if (isNative) {
          // 设置状态栏样式
          if (window.Capacitor.Plugins.StatusBar) {
            await window.Capacitor.Plugins.StatusBar.setStyle({ style: 'LIGHT' });
            await window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#f8fafc' });
          }

          // 隐藏启动屏幕
          if (window.Capacitor.Plugins.SplashScreen) {
            await window.Capacitor.Plugins.SplashScreen.hide();
          }

          // 设置键盘行为
          if (window.Capacitor.Plugins.Keyboard) {
            window.Capacitor.Plugins.Keyboard.addListener('keyboardWillShow', () => {
              document.body.classList.add('keyboard-open');
            });

            window.Capacitor.Plugins.Keyboard.addListener('keyboardWillHide', () => {
              document.body.classList.remove('keyboard-open');
            });
          }

          // 处理应用状态变化
          if (window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
              console.log('App state changed. Is active?', isActive);
              if (isActive) {
                this.handleAppResume();
              } else {
                this.handleAppPause();
              }
            });

            // 处理返回按钮（Android）
            window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
              if (!canGoBack) {
                window.Capacitor.Plugins.App.exitApp();
              } else {
                window.history.back();
              }
            });
          }

          // 添加原生应用样式
          document.body.classList.add('native-app');
        }
      } catch (error) {
        console.log('Capacitor not available or initialization failed:', error);
      }
    }
  }

  static handleAppResume() {
    console.log('App resumed');
    // 应用恢复时的逻辑，比如刷新阅读进度
    window.dispatchEvent(new CustomEvent('appResume'));
  }

  static handleAppPause() {
    console.log('App paused - saving data');
    // 应用暂停时保存数据
    window.dispatchEvent(new CustomEvent('appPause'));
  }

  static isNative() {
    return typeof window !== 'undefined' && 
           window.Capacitor && 
           window.Capacitor.isNativePlatform && 
           window.Capacitor.isNativePlatform();
  }

  static getPlatform() {
    if (typeof window !== 'undefined' && window.Capacitor) {
      return window.Capacitor.getPlatform();
    }
    return 'web';
  }

  static async share(options) {
    if (this.isNative() && window.Capacitor.Plugins.Share) {
      try {
        await window.Capacitor.Plugins.Share.share(options);
        return true;
      } catch (error) {
        console.error('Native share failed:', error);
        return false;
      }
    }
    return false;
  }
}