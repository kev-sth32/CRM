const {normalize}=require('../webhook');
function normalizeWebChat(payload){if(!payload||!payload.session_id||!payload.message)return null;return normalize('website_chat',{external_id:payload.event_id||`${payload.session_id}-${payload.message_id||Date.now()}`,sender:payload.sender||{},text:payload.message,occurred_at:payload.occurred_at,metadata:{session_id:payload.session_id,page_url:payload.page_url||null,tenant_id:payload.tenant_id||null}})}
module.exports={normalizeWebChat};
