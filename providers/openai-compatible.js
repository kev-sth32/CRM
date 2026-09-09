class OpenAICompatibleProvider {
  constructor({ apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o-mini', timeoutMs = 20000 } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl ? baseUrl.replace(/\/$/, '') : 'https://api.openai.com/v1';
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generate(request = {}) {
    if (!this.apiKey) throw Error('AI provider API key is required');

    const activeModel = request.model || this.model;
    const temperature = request.temperature !== undefined ? request.temperature : 0.2;
    const max_tokens = request.max_tokens || 1024;
    const messages = [];

    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    if (Array.isArray(request.messages)) {
      messages.push(...request.messages);
    }

    const payload = {
      model: activeModel,
      messages,
      temperature,
      max_tokens
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs || this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          errDetail = errBody.detail || errBody.error?.message || errBody.title || errDetail;
        } catch (_) {}
        throw new Error(`AI Provider (${activeModel}) failed: ${errDetail}`);
      }

      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content || '',
        model: data.model || activeModel,
        usage: data.usage || null
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { OpenAICompatibleProvider };
