const CACHE='brain-center-v3';
const SHELL=['./','./index.html','./brain.html','./calendar-connect.html','./manifest.webmanifest','./icon.svg'];
const TRANSCRIBE='https://uvzivnoljpdgmasuzqqv.supabase.co/functions/v1/transcribe-service';

self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});

self.addEventListener('fetch',e=>{
  const ct=e.request.headers.get('content-type')||'';
  if(e.request.method==='POST'&&ct.includes('multipart/form-data')){
    e.respondWith((async()=>{
      const req=e.request.clone();
      const body=await req.arrayBuffer();
      const headers=new Headers(req.headers);
      return fetch(TRANSCRIBE,{method:'POST',headers,body});
    })());
    return;
  }
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});