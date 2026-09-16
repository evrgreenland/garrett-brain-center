(()=>{
  const EDIT_ENDPOINT='https://uvzivnoljpdgmasuzqqv.supabase.co/functions/v1/item-edit-service';
  let current={id:null,card:null};

  function status(msg,cls=''){
    try{ if(typeof setStatus==='function') return setStatus(msg,cls); }catch{}
    const el=document.getElementById('status'); if(el){el.textContent=msg;el.className='status '+cls;}
  }

  function itemId(card){
    for(const el of card.querySelectorAll('[onclick]')){
      const s=el.getAttribute('onclick')||'';
      const m=s.match(/(?:startItem|doneItem|openDefer|openAssign|obsoleteItem|wakeNow)\('([^']+)'\)/);
      if(m)return m[1];
    }
    return null;
  }

  function cleanTitle(t){return String(t||'').replace(/^\s*\d+\.\s*/,'').trim()}

  function ensureDialog(){
    if(document.getElementById('wordingEditDialog'))return;
    const d=document.createElement('dialog');
    d.id='wordingEditDialog';
    d.innerHTML=`<div class="dialogBody"><h3>Edit task wording</h3><div class="sub" style="margin-top:6px">Fix a transcription mistake or clarify what the task actually means.</div><div style="margin-top:12px"><input id="wordingEditTitle" placeholder="Task title"></div><div style="margin-top:9px"><textarea id="wordingEditNext" placeholder="Next action"></textarea></div><button id="wordingEditSave" class="btn primary">SAVE CHANGES</button><button id="wordingEditCancel" class="btn">Cancel</button></div>`;
    document.body.appendChild(d);
    document.getElementById('wordingEditCancel').onclick=()=>{current={id:null,card:null};d.close()};
    document.getElementById('wordingEditSave').onclick=save;
  }

  async function open(card,id){
    ensureDialog(); current={id,card};
    const title=cleanTitle(card.querySelector('.title,.runwayTitle')?.textContent||'');
    const sub=[...card.querySelectorAll('.sub')].find(x=>x.closest('.daily,.runwayItem')===card||card.classList.contains('daily'));
    document.getElementById('wordingEditTitle').value=title;
    document.getElementById('wordingEditNext').value=(sub?.textContent||'').trim();
    document.getElementById('wordingEditDialog').showModal();
  }

  async function save(){
    if(!current.id)return;
    const title=document.getElementById('wordingEditTitle').value.trim();
    const next_action=document.getElementById('wordingEditNext').value.trim();
    if(!title)return status('Task title cannot be blank.','err');
    const btn=document.getElementById('wordingEditSave');
    try{
      btn.disabled=true;
      const {data}=await sb.auth.getSession(); const sess=data.session;
      if(!sess)throw Error('Sign in first');
      const r=await fetch(EDIT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sess.access_token,apikey:KEY},body:JSON.stringify({item_id:current.id,title,next_action})});
      const d=await r.json(); if(!r.ok)throw Error(d.error||'Edit failed');
      document.getElementById('wordingEditDialog').close(); current={id:null,card:null};
      status('Task wording updated.','ok');
      try{ if(typeof refreshAll==='function') await refreshAll(); }catch{}
      setTimeout(scan,50);
    }catch(e){status(e.message||String(e),'err')}finally{btn.disabled=false}
  }

  function scan(){
    document.querySelectorAll('.daily').forEach(card=>{
      if(card.querySelector('.wordingEditBtn'))return;
      const id=itemId(card); if(!id)return;
      let row=card.querySelector('.row');
      if(!row){row=document.createElement('div');row.className='row';row.style.marginTop='8px';card.appendChild(row)}
      const b=document.createElement('button'); b.className='btn mini wordingEditBtn'; b.textContent='✎ EDIT'; b.onclick=()=>open(card,id); row.appendChild(b);
    });
  }

  ensureDialog(); scan();
  new MutationObserver(()=>scan()).observe(document.body,{childList:true,subtree:true});
})();