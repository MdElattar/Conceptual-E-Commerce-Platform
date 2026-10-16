import { get, set, isCacheReady } from '../utils/cacheService.js';

export function cache(durationSeconds = 300) {
  return (req, res, next) => {
    if (!isCacheReady()) return next();

    const key = `cache:${req.originalUrl || req.url}`;

    get(key).then(cached => {
      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          set(key, body, durationSeconds);
        }
        return originalJson(body);
      };

      next();
    }).catch(() => next());
  };
}
