export class CacheManager {
  constructor(key = "github_org_cache", expirationTime = 24 * 60 * 60 * 1000) {
    this.key = key;
    this.expirationTime = expirationTime;
  }

  save(orgName, data) {
    try {
      const cache = {
        timestamp: new Date().getTime(),
        orgName,
        data,
      };
      localStorage.setItem(this.key, JSON.stringify(cache));
    } catch (error) {
      // If localStorage is full, try removing the images
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, removing image data');
        const cache = {
          timestamp: new Date().getTime(),
          orgName,
          data: {
            ...data,
            pullRequests: data.pullRequests.map(pr => ({
              ...pr,
              images: [] // Remove images to save space
            }))
          }
        };
        localStorage.setItem(this.key, JSON.stringify(cache));
      } else {
        console.error('Failed to save to cache:', error);
      }
    }
  }

  get(orgName) {
    const cached = localStorage.getItem(this.key);
    if (!cached) return null;

    const cache = JSON.parse(cached);
    const now = new Date().getTime();

    // Check if cache is expired or for different org
    if (
      cache.orgName !== orgName ||
      now - cache.timestamp > this.expirationTime
    ) {
      localStorage.removeItem(this.key);
      return null;
    }

    return cache.data;
  }
}
