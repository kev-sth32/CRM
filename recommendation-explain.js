function explain(products,signals=[]){return products.map((p,i)=>({product:p,rank:i+1,reasons:signals.length?signals:['Matches the requested business need']}))}module.exports={explain};
