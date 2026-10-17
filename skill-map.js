(function(root){'use strict';
  function groups(data){return [...data.trees,...Object.values(data.jobTrees)];}
  function create(data){
    const list=groups(data),positions=new Map(),labels=[];
    const all=[...list.flatMap(group=>group.nodes),...data.hiddenNodes];
    const byId=new Map(all.map(node=>[node.nodeId,node]));
    const depthCache=new Map();
    function depth(node,seen=new Set()){
      if(depthCache.has(node.nodeId))return depthCache.get(node.nodeId);
      if(seen.has(node.nodeId))return 0;
      const next=new Set(seen);next.add(node.nodeId);
      const parents=(node.prerequisites||[]).map(id=>byId.get(id)).filter(parent=>parent&&parent.treeId===node.treeId);
      const value=parents.length?Math.max(...parents.map(parent=>depth(parent,next)))+1:0;
      depthCache.set(node.nodeId,value);return value;
    }
    list.forEach((group,index)=>{
      const angle=-Math.PI/2+index*2*Math.PI/list.length;
      const radial={x:Math.cos(angle),y:Math.sin(angle)},tangent={x:-radial.y,y:radial.x};
      const nodes=all.filter(node=>node.treeId===group.id),layers=new Map();
      nodes.forEach(node=>{const level=depth(node);if(!layers.has(level))layers.set(level,[]);layers.get(level).push(node);});
      for(const [level,layer] of layers){
        layer.forEach((node,offset)=>{
          const radius=285+level*168,spread=(offset-(layer.length-1)/2)*94;
          positions.set(node.nodeId,{x:radial.x*radius+tangent.x*spread,y:radial.y*radius+tangent.y*spread});
        });
      }
      labels.push({id:group.id,name:group.name,color:group.color,x:radial.x*216,y:radial.y*216});
    });
    return {groups:list,positions,labels,position(node){return positions.get(node.nodeId)||{x:node.x,y:node.y};}};
  }
  function visible(game,data){
    return [...groups(data).flatMap(group=>group.nodes),...data.hiddenNodes].filter(node=>
      node.unlockKind!=='book'||game.state.run.bookUsed.includes(node.sourceBookId)||game.state.run.skills.includes(node.nodeId)
    );
  }
  function revealed(game,node){return game.state.run.skills.includes(node.nodeId)||game.canBuyNode(node.nodeId);}
  function prominent(node){return node.rarity==='epic'||node.rarity==='legendary';}
  const api={create,visible,revealed,prominent};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SkillMap=api;
})(typeof window!=='undefined'?window:globalThis);
