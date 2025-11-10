/**
 * 图片 URL 缓存管理器
 * 使用 LRU (Least Recently Used) 算法
 * 缓存小说封面、作者头像和背景图的 URL
 */

const CACHE_KEY = 'redmansion_image_cache';
const MAX_NOVELS = 40;
const MAX_AUTHORS = 20;

class ImageCacheManager {
  constructor() {
    this.cache = this.loadCache();
  }

  /**
   * 从 sessionStorage 加载缓存
   */
  loadCache() {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load image cache:', error);
    }
    
    return {
      novels: {},
      authors: {}
    };
  }

  /**
   * 保存缓存到 sessionStorage
   */
  saveCache() {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save image cache:', error);
      // sessionStorage 可能已满，尝试清理最旧的条目
      this.cleanup();
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
      } catch (retryError) {
        console.error('Failed to save image cache after cleanup:', retryError);
      }
    }
  }

  /**
   * 获取小说封面 URL
   */
  getNovelCover(novelId) {
    const entry = this.cache.novels[novelId];
    if (entry) {
      // 更新访问时间
      entry.lastAccessed = Date.now();
      this.saveCache();
      return entry.url;
    }
    return null;
  }

  /**
   * 设置小说封面 URL
   */
  setNovelCover(novelId, url) {
    if (!novelId || !url) return;
    
    this.cache.novels[novelId] = {
      url: url,
      lastAccessed: Date.now()
    };
    
    // 检查是否超出限制
    const novelIds = Object.keys(this.cache.novels);
    if (novelIds.length > MAX_NOVELS) {
      // 按访问时间排序，删除最旧的
      const sorted = novelIds.sort((a, b) => {
        return this.cache.novels[a].lastAccessed - this.cache.novels[b].lastAccessed;
      });
      
      // 删除最旧的 25%
      const toDelete = Math.ceil(novelIds.length * 0.25);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache.novels[sorted[i]];
      }
    }
    
    this.saveCache();
  }

  /**
   * 获取作者头像和背景图
   */
  getAuthorImages(authorAddress) {
    const entry = this.cache.authors[authorAddress];
    if (entry) {
      // 更新访问时间
      entry.lastAccessed = Date.now();
      this.saveCache();
      return {
        avatar: entry.avatar,
        cover: entry.cover
      };
    }
    return null;
  }

  /**
   * 设置作者头像和背景图
   */
  setAuthorImages(authorAddress, avatar, cover) {
    if (!authorAddress) return;
    
    this.cache.authors[authorAddress] = {
      avatar: avatar || '',
      cover: cover || '',
      lastAccessed: Date.now()
    };
    
    // 检查是否超出限制
    const authorAddresses = Object.keys(this.cache.authors);
    if (authorAddresses.length > MAX_AUTHORS) {
      // 按访问时间排序，删除最旧的
      const sorted = authorAddresses.sort((a, b) => {
        return this.cache.authors[a].lastAccessed - this.cache.authors[b].lastAccessed;
      });
      
      // 删除最旧的 25%
      const toDelete = Math.ceil(authorAddresses.length * 0.25);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache.authors[sorted[i]];
      }
    }
    
    this.saveCache();
  }

  /**
   * 清理缓存（当 sessionStorage 满时）
   */
  cleanup() {
    // 清理 50% 的最旧条目
    const novelIds = Object.keys(this.cache.novels);
    if (novelIds.length > 0) {
      const sorted = novelIds.sort((a, b) => {
        return this.cache.novels[a].lastAccessed - this.cache.novels[b].lastAccessed;
      });
      const toDelete = Math.ceil(novelIds.length * 0.5);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache.novels[sorted[i]];
      }
    }
    
    const authorAddresses = Object.keys(this.cache.authors);
    if (authorAddresses.length > 0) {
      const sorted = authorAddresses.sort((a, b) => {
        return this.cache.authors[a].lastAccessed - this.cache.authors[b].lastAccessed;
      });
      const toDelete = Math.ceil(authorAddresses.length * 0.5);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache.authors[sorted[i]];
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache = {
      novels: {},
      authors: {}
    };
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      novels: Object.keys(this.cache.novels).length,
      authors: Object.keys(this.cache.authors).length,
      maxNovels: MAX_NOVELS,
      maxAuthors: MAX_AUTHORS
    };
  }
}

// 导出单例
export const imageCacheManager = new ImageCacheManager();