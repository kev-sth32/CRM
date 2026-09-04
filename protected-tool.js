const {guardAction}=require('./ai-guardrails');
function protectedTool({tool,action,pool}){return {...tool,execute:async(input,ctx)=>{const policy=ctx.policy||{agent_mode:'disabled',approval_required:[]};const gate=await guardAction({pool,policy,tenantId:ctx.tenant_id,userId:ctx.user_id,aiRunId:ctx.ai_run_id,action,payload:input});if(!gate.execute)return {status:'approval_required',approval_id:gate.approval.id,action};return tool.execute(input,ctx)}}}
module.exports={protectedTool};
