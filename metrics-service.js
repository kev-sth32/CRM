/**
 * metrics-service.js
 * High-Throughput Prometheus Metrics Scrape Engine
 * Exposes latency histograms, HTTP status counters, active SSE client gauges, and memory stats.
 */

class MetricsService {
  constructor() {
    this.requestsTotal = new Map(); // key: "METHOD /path status" -> count
    this.latencyBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
    this.durationHistogram = new Map(); // bucket -> count
    this.latencyBuckets.forEach(b => this.durationHistogram.set(b, 0));
    this.durationSum = 0;
    this.durationCount = 0;
    this.activeSseClients = 0;
  }

  normalizePath(pathname) {
    if (!pathname) return '/';
    // Normalize IDs to prevent cardinality explosion (e.g. /api/quotes/qt-123 -> /api/quotes/:id)
    return pathname
      .replace(/\/(usr|lead|oppo|quote|cont|comp|act|task|wh|sub|cf)-[a-zA-Z0-9_-]+/g, '/:id')
      .replace(/\/quotes\/[a-f0-9]{32,64}/g, '/quotes/:token');
  }

  recordRequest(method, pathname, statusCode, durationMs) {
    const normPath = this.normalizePath(pathname);
    const key = `${method} ${normPath} ${statusCode}`;
    this.requestsTotal.set(key, (this.requestsTotal.get(key) || 0) + 1);

    this.durationCount++;
    this.durationSum += durationMs;

    for (const b of this.latencyBuckets) {
      if (durationMs <= b) {
        this.durationHistogram.set(b, (this.durationHistogram.get(b) || 0) + 1);
      }
    }
  }

  setSseClients(count) {
    this.activeSseClients = count;
  }

  getPrometheusFormat() {
    const lines = [];
    const mem = process.memoryUsage();

    lines.push('# HELP salesos_http_requests_total Total number of HTTP requests processed by SalesOS.');
    lines.push('# TYPE salesos_http_requests_total counter');
    for (const [key, val] of this.requestsTotal.entries()) {
      const [method, path, status] = key.split(' ');
      lines.push(`salesos_http_requests_total{method="${method}",path="${path}",status="${status}"} ${val}`);
    }

    lines.push('\n# HELP salesos_http_request_duration_ms Latency of HTTP requests in milliseconds.');
    lines.push('# TYPE salesos_http_request_duration_ms histogram');
    for (const [b, count] of this.durationHistogram.entries()) {
      lines.push(`salesos_http_request_duration_ms_bucket{le="${b}"} ${count}`);
    }
    lines.push(`salesos_http_request_duration_ms_bucket{le="+Inf"} ${this.durationCount}`);
    lines.push(`salesos_http_request_duration_ms_sum ${Math.round(this.durationSum)}`);
    lines.push(`salesos_http_request_duration_ms_count ${this.durationCount}`);

    lines.push('\n# HELP salesos_active_sse_clients Currently connected Server-Sent Events subscribers.');
    lines.push('# TYPE salesos_active_sse_clients gauge');
    lines.push(`salesos_active_sse_clients ${this.activeSseClients}`);

    lines.push('\n# HELP process_resident_memory_bytes Resident memory size in bytes.');
    lines.push('# TYPE process_resident_memory_bytes gauge');
    lines.push(`process_resident_memory_bytes ${mem.rss}`);

    lines.push('\n# HELP nodejs_heap_used_bytes Memory used by JavaScript heap in bytes.');
    lines.push('# TYPE nodejs_heap_used_bytes gauge');
    lines.push(`nodejs_heap_used_bytes ${mem.heapUsed}`);

    return lines.join('\n') + '\n';
  }
}

module.exports = new MetricsService();
