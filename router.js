/**
 * router.js
 * High-Performance, Zero-Dependency Modular HTTP Router
 * Supports method multiplexing, parameterized dynamic routes (:id), middleware chaining, and async dispatch.
 */

class Router {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  add(method, pattern, ...handlers) {
    // Convert pattern like /api/quotes/:id to regex and param names
    const paramNames = [];
    const regexPath = pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexPath}$`);

    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      regex,
      paramNames,
      handlers
    });
    return this;
  }

  get(pattern, ...handlers) { return this.add('GET', pattern, ...handlers); }
  post(pattern, ...handlers) { return this.add('POST', pattern, ...handlers); }
  patch(pattern, ...handlers) { return this.add('PATCH', pattern, ...handlers); }
  delete(pattern, ...handlers) { return this.add('DELETE', pattern, ...handlers); }
  put(pattern, ...handlers) { return this.add('PUT', pattern, ...handlers); }

  /**
   * Matches an incoming request against registered routes
   * @param {string} method
   * @param {string} pathname
   * @returns {{ route: object, params: object }|null}
   */
  match(method, pathname) {
    const reqMethod = (method || 'GET').toUpperCase();

    for (const r of this.routes) {
      if (r.method !== reqMethod && r.method !== 'ALL') continue;
      const m = pathname.match(r.regex);
      if (m) {
        const params = {};
        for (let i = 0; i < r.paramNames.length; i++) {
          params[r.paramNames[i]] = decodeURIComponent(m[i + 1]);
        }
        return { route: r, params };
      }
    }
    return null;
  }

  /**
   * Dispatches the request through matching route handlers
   */
  async handle(req, res, pathname, context = {}) {
    const match = this.match(req.method, pathname);
    if (!match) return false; // Not handled by this router

    req.params = match.params;

    // Run middlewares then handlers
    const pipeline = [...this.middlewares, ...match.route.handlers];
    for (const fn of pipeline) {
      const result = await fn(req, res, context);
      if (result !== undefined || res.writableEnded) {
        return true; // Request completed
      }
    }
    return true;
  }
}

module.exports = Router;
