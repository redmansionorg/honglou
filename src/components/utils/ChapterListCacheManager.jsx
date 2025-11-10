/**
 * 小说章节列表缓存管理器
 * 使用 LRU (Least Recently Used) 算法
 * 缓存小说的章节目录（不含 content）
 */

const CACHE_KEY = 'redmansion_chapter_list_cache';
const MAX_NOVEL_CHAPTER_LISTS = 40; // 最多缓存 40 部小说的章节列表
const CACHE_EXPIRATION_HOURS = 24; // 缓存有效期 24 小时

class ChapterListCacheManager {
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
      console.warn('Failed to load chapter list cache:', error);
    }
    
    return {}; // { novelId: { chapters: [...], timestamp: Date.now() } }
  }

  /**
   * 保存缓存到 sessionStorage
   */
  saveCache() {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save chapter list cache:', error);
      // sessionStorage 可能已满，尝试清理最旧的条目
      this.cleanup();
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
      } catch (retryError) {
        console.error('Failed to save chapter list cache after cleanup:', retryError);
      }
    }
  }

  /**
   * 获取小说的章节列表
   * 返回 { chapters: [...], expired: boolean }
   */
  getChapters(novelId) {
    const entry = this.cache[novelId];
    if (entry) {
      // 检查是否过期
      const now = Date.now();
      const isExpired = (now - entry.timestamp) > (CACHE_EXPIRATION_HOURS * 60 * 60 * 1000);
      
      // 更新访问时间 (LRU 策略)
      entry.timestamp = now;
      this.saveCache();

      return { chapters: entry.chapters, expired: isExpired };
    }
    return { chapters: null, expired: true };
  }

  /**
   * 设置小说的章节列表
   */
  setChapters(novelId, chapters) {
    if (!novelId || !chapters) return;
    
    this.cache[novelId] = {
      chapters: chapters,
      timestamp: Date.now()
    };
    
    // 检查是否超出限制
    const novelIds = Object.keys(this.cache);
    if (novelIds.length > MAX_NOVEL_CHAPTER_LISTS) {
      // 按时间戳排序，删除最旧的 25%
      const sorted = novelIds.sort((a, b) => {
        return this.cache[a].timestamp - this.cache[b].timestamp;
      });
      
      const toDelete = Math.ceil(novelIds.length * 0.25);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache[sorted[i]];
      }
    }
    
    this.saveCache();
  }

  /**
   * 清理缓存（当 sessionStorage 满或手动调用时）
   */
  cleanup() {
    // 清理 50% 的最旧条目
    const novelIds = Object.keys(this.cache);
    if (novelIds.length > 0) {
      const sorted = novelIds.sort((a, b) => {
        return this.cache[a].timestamp - this.cache[b].timestamp;
      });
      const toDelete = Math.ceil(novelIds.length * 0.5);
      for (let i = 0; i < toDelete; i++) {
        delete this.cache[sorted[i]];
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache = {};
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear chapter list cache:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      cachedNovels: Object.keys(this.cache).length,
      maxNovels: MAX_NOVEL_CHAPTER_LISTS,
      expirationHours: CACHE_EXPIRATION_HOURS
    };
  }
}

// 导出单例
export const chapterListCacheManager = new ChapterListCacheManager();