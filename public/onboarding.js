// A small guide driven by completed actions, not a timed slideshow.
(function(){
 const key='pond-guide-v1',stages=new Set(['welcome','hello','play','food','fed','bomb','bounced','done']);
 let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 let guideSignature='';
 let phase=stages.has(saved?.phase)?saved.phase:(ownedIds().length?'done':'welcome'),started=false;
 const card=$('#onboardingCard'),wide=matchMedia('(min-width:1000px)');
 function draft(){try{const d=JSON.parse(localStorage.getItem('pond-draft-v1'));return d&&typeof d.author==='string'&&typeof d.drawing==='string'&&d.drawing.startsWith('data:image/png;base64,')?d:null;}catch{return null;}}
 function setPhase(next){phase=next;localStorage.setItem(key,JSON.stringify({phase}));renderGuide();}
 function finish(){setPhase('done');selectToy('hand');$('#guidePointer').hidden=true;}
 function action(label,handler,primary=false){const b=el('button',primary?'primary':'guide-secondary',label);b.type='button';b.onclick=handler;$('#guideActions').append(b);}
 function placeCard(){const rail=$('.desktop-community');if(wide.matches){if(card.parentElement!==rail)rail.prepend(card);}else if(card.parentElement!==$('#pondView'))$('#pondView').insertBefore(card,$('#itemTray'));}
 function pointerForToy(){if(pendingPlacement)return;const hand=$('#guidePointer');const show=activeView==='pond'&&((phase==='food'&&selectedToy==='food')||(phase==='bomb'&&selectedToy==='bomb'));hand.hidden=!show;if(show){const r=$('#animals').getBoundingClientRect(),p=$('#pond').getBoundingClientRect();hand.style.left=(r.left-p.left+r.width*.6)+'px';hand.style.top=(r.top-p.top+r.height*.46)+'px';}}
 function renderGuide(){
  placeCard();const animal=activeAnimal(),unfinished=draft(),resume=$('#resumeAnimalDraft');if(started&&phase==='welcome'&&animal&&!unfinished){setPhase('hello');return;}resume.hidden=!unfinished;resume.textContent=unfinished?'Finish placing '+unfinished.author+' →':'Finish placing your animal';
  const showing=started&&activeView==='pond'&&!pendingPlacement&&phase!=='done';card.hidden=!showing;document.body.dataset.guide=showing?phase:'';
  if(phase==='hello'&&animal)$('#chatText').placeholder='Say hello as '+animal.author+'…';
  if(!showing){guideSignature='';document.querySelectorAll('.guide-target').forEach(n=>n.classList.remove('guide-target'));pointerForToy();return;}
  const signature=JSON.stringify([phase,selectedToy,animal?.id,animal?.author,unfinished?.author,state.posts.length>0,paused]);if(signature===guideSignature){pointerForToy();return;}guideSignature=signature;document.querySelectorAll('.guide-target').forEach(n=>n.classList.remove('guide-target'));
  const copy={
   welcome:unfinished?['READY TO JOIN','Your animal is ready.',unfinished.author+' still needs a home. Choose a spot in the water, then confirm it.']:['WELCOME TO POP POND','Make a little you.','Color a little animal, choose its home, and give it a voice.'],
   hello:['3 · SAY HELLO','You’re in, '+(animal?.author||'friend')+'!','Type a hello below. Your words become your animal’s speech bubble.'],
   play:['YOUR LITTLE PLACE IN THE POND','One hello can start a friendship.','Want to try a little pond mischief?'],
   food:['OPTIONAL · FEED A FRIEND','Food brings friends together.',selectedToy==='food'?'Now tap the water to drop a snack. They’ll swim over.':'Choose Food below, then tap a spot in the water.'],
   fed:['A LITTLE RIPPLE','A snack brings everyone closer.',paused?'Resume drifting to let them swim over. There’s one more toy to try.':'Watch them gather. There’s one more toy to try.'],
   bomb:['OPTIONAL · MAKE A SPLASH','A little harmless chaos.',selectedToy==='bomb'?'Now tap the pond for a bubble bomb. They’ll bounce back home.':'Choose Bubble bomb below, then tap the pond.'],
   bounced:['BOING!','They always find their way home.','Use the hand to pop an animal or hold to move it. Tap a speech bubble to reply.']
  }[phase]||[];
  $('#guideStep').textContent=copy[0]||'';$('#guideTitle').textContent=copy[1]||'';$('#guideCopy').textContent=copy[2]||'';$('#guideActions').replaceChildren();
  if(phase==='welcome'){action(unfinished?'Choose '+unfinished.author+'’s home':'＋ Make a little you',()=>unfinished?startPlacement(unfinished):openDraw(),true);action('Just looking? Explore the pond',finish);if(state.posts.length)action('Already made an animal?',()=>setView('my'));}
  else if(phase==='hello'){if(!animal){setPhase('welcome');return;}$('#chatText').placeholder='Say hello as '+animal.author+'…';$('#chatForm').classList.add('guide-target');action('Skip hello',()=>setPhase('play'));}
  else if(phase==='play'){action('Show me the toys →',()=>{selectToy('hand');setPhase('food');},true);action('Just float',finish);}
  else if(phase==='food'||phase==='bomb'){const target=phase==='food'?'food':'bomb';if(selectedToy!==target)document.querySelector('button[data-toy="'+target+'"]').classList.add('guide-target');action('Skip this',()=>phase==='food'?setPhase('bomb'):finish());}
  else if(phase==='fed'){if(paused)$('#pause').classList.add('guide-target');action('Next: a tiny splash →',()=>{selectToy('hand');setPhase('bomb');},true);action('That’s enough for me',finish);}
  else if(phase==='bounced'){action('Let me play',finish,true);}
  pointerForToy();
 }
 $('#skipGuide').onclick=finish;$('#guideReplay').onclick=()=>{setView('pond');setPhase(activeAnimal()?'hello':'welcome');};
 $('#resumeAnimalDraft').onclick=()=>{const d=draft();if(d)startPlacement(d);};
 document.addEventListener('pond:sync',()=>{started=true;renderGuide();});
 document.addEventListener('pond:view',renderGuide);document.addEventListener('pond:placement',renderGuide);document.addEventListener('pond:toy',renderGuide);
 document.addEventListener('pond:placed',e=>{if(e.detail.created&&phase!=='done')setPhase('hello');else renderGuide();});
 document.addEventListener('pond:message',()=>{if(phase==='hello')setPhase('play');});
 document.addEventListener('pond:used-toy',e=>{if(phase==='food'&&e.detail==='food')setPhase('fed');else if(phase==='bomb'&&e.detail==='bomb')setPhase('bounced');});
 wide.addEventListener('change',renderGuide);new ResizeObserver(pointerForToy).observe($('#pond'));renderGuide();
})();
