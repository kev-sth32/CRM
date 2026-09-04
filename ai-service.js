class AIService {
  constructor({ provider = null, tools = new Map(), pool = null } = {}) {
    this.provider = provider;
    this.tools = tools;
    this.pool = pool;
  }

  register(tool) {
    if (!tool.name || !tool.execute || !tool.permission) throw Error('Invalid AI tool');
    this.tools.set(tool.name, tool);
  }

  async policy(ctx) {
    if (!this.pool) return null;
    return (await this.pool.query('SELECT agent_mode,allowed_tools,approval_required,daily_budget_micros FROM ai_policies WHERE tenant_id=$1', [ctx.tenant_id])).rows[0] || { agent_mode: 'disabled', allowed_tools: [] };
  }

  async runTool(name, input, ctx) {
    const tool = this.tools.get(name);
    if (!tool) throw Error('Unknown AI tool');
    if (!ctx?.tenant_id) throw Error('Tenant context required');
    if (!ctx.permissions?.includes(tool.permission)) throw Error('AI tool permission denied');
    const p = await this.policy(ctx);
    if (p?.agent_mode === 'disabled') throw Error('AI agent is disabled');
    if (Array.isArray(p?.allowed_tools) && !p.allowed_tools.includes(name)) throw Error('AI tool is not allowed by tenant policy');

    const started = Date.now();
    try {
      const result = await tool.execute(input, ctx);
      if (this.pool) {
        await this.pool.query(
          'INSERT INTO ai_runs(tenant_id,agent_name,task,status,confidence,input_refs,output,latency_ms,completed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now())',
          [ctx.tenant_id, ctx.agent_name || 'copilot', name, 'completed', tool.confidence || 1, { tool: name }, { result }, Date.now() - started]
        );
      }
      return { tool: name, result, confidence: tool.confidence || 1 };
    } catch (error) {
      if (this.pool) {
        await this.pool.query(
          'INSERT INTO ai_runs(tenant_id,agent_name,task,status,error,latency_ms,completed_at) VALUES($1,$2,$3,$4,$5,$6,now())',
          [ctx.tenant_id, ctx.agent_name || 'copilot', name, 'failed', error.message, Date.now() - started]
        );
      }
      throw error;
    }
  }

  /**
   * Closed-loop few-shot evaluation feedback injection (PRD §55)
   */
  enrichWithEvaluations(request, evaluations = []) {
    if (!Array.isArray(evaluations) || evaluations.length === 0) return request;
    const goodExamples = evaluations
      .filter(e => e.rating === 'good' && (!e.tenant_id || e.tenant_id === request.tenant_id))
      .slice(0, 3)
      .map(e => ({ note: e.notes || 'High quality approved response', input: e.input_context || null }));
    const badPatterns = evaluations
      .filter(e => e.rating === 'bad' && (!e.tenant_id || e.tenant_id === request.tenant_id))
      .slice(0, 3)
      .map(e => e.notes || 'Avoid unsupported claims or unapproved discount percentages');

    return {
      ...request,
      few_shot_examples: goodExamples,
      avoid_patterns: badPatterns
    };
  }

  async generate(request, evaluations = []) {
    if (!this.provider) throw Error('No AI provider configured');
    if (!request.tenant_id) throw Error('Tenant context required');
    const enriched = this.enrichWithEvaluations(request, evaluations);
    return this.provider.generate(enriched);
  }
}

module.exports = { AIService };
