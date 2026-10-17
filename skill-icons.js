(function(root){'use strict';
  const glyphs={
    attack:['⚔','✧','➤','◆','♛'],critical:['✦','ϟ','♨','✶','❋'],survival:['✚','⛨','♥','◇','✥'],
    bounty:['⌖','➤','◉','✧','⚔'],luck:['◇','▣','♢','✦','✶'],gather:['♣','⌕','✿','☘','✦'],
    companions:['♟','♙','♞','♜','♛'],petGrowth:['♣','✿','♧','♥','✦'],fame:['★','♛','✧','♕','✶'],
    tavern:['♨','☕','✦','◈','❋'],processing:['⚒','◆','◈','✶'],explore:['➤','⌖','◇'],
    'job-thief':['♠','➤'],'job-priest':['✚','✥'],'job-knight':['⛨','⚔'],'job-warrior':['⚔','✦'],'job-mage':['✧','✶'],
    heaven:['✦','✧','✶','❋']
  };
  const rim={common:'#87919e',uncommon:'#86bf95',rare:'#76badd',epic:'#c49ee8',legendary:'#f7d27e'};
  const tint={attack:'#ffb59c',critical:'#ffe39a',survival:'#b5e9bd',bounty:'#f3cc90',luck:'#d8c0ff',gather:'#b8ec9e',companions:'#efb1cf',petGrowth:'#cce594',fame:'#ffd5a3',tavern:'#edbd93',processing:'#b7d7cf',explore:'#a9ceff','job-thief':'#caade8','job-priest':'#d8f2c4','job-knight':'#f7d09b','job-warrior':'#f0ac9c','job-mage':'#c2bcf6',heaven:'#ffe3a3'};
  function radius(node){return node.rarity==='legendary'?42:node.rarity==='epic'?34:node.rarity==='rare'?28:23;}
  function symbol(node){const choices=glyphs[node.treeId]||['✦','◇','✧'];return choices[(node.tier||0)%choices.length];}
  function draw(ctx,node,x,y,{owned=false,available=false,selected=false}={}){
    const r=radius(node),awake=owned||available,color=rim[node.rarity]||rim.common;
    ctx.save();ctx.translate(x,y);
    if(awake){ctx.shadowBlur=node.rarity==='legendary'?23:available?13:7;ctx.shadowColor=color;}
    ctx.beginPath();ctx.arc(0,0,r+3,0,Math.PI*2);ctx.fillStyle=awake?'#111720':'#10141d';ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.lineWidth=node.rarity==='legendary'?5:3;ctx.strokeStyle=awake?color:'#5e6170';ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r-5,0,Math.PI*2);ctx.fillStyle=owned?'#665330':available?'#293542':'#222732';ctx.fill();
    ctx.beginPath();ctx.arc(0,0,r-7,0,Math.PI*2);ctx.lineWidth=1.5;ctx.strokeStyle=awake?'#f5dfad77':'#73788855';ctx.stroke();
    if(node.rarity==='epic'||node.rarity==='legendary'){
      ctx.fillStyle=awake?color:'#596071';for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillRect(Math.round(Math.cos(a)*(r+7))-2,Math.round(Math.sin(a)*(r+7))-2,4,4);}
    }
    ctx.font=`bold ${Math.round(r*.94)}px "Segoe UI Symbol","Noto Sans Symbols 2",sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=awake?tint[node.treeId]||'#fff4d9':'#606777';
    ctx.fillText(symbol(node),0,1);
    if(selected){ctx.beginPath();ctx.arc(0,0,r+10,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle='#fff4bd';ctx.stroke();}
    ctx.restore();
  }
  const api={draw,radius,symbol};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SkillIcons=api;
})(typeof window!=='undefined'?window:globalThis);
