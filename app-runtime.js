const {AIService}=require('./ai-service');const {registerCRMTools}=require('./ai-tools');
function createAppRuntime(pool,provider=null){const ai=new AIService({pool,provider});registerCRMTools(ai,pool);return {ai};}
module.exports={createAppRuntime};
