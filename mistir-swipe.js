/* Mistir Gift: swipe left from shop to wishlists; right to return. */
(function () {
  'use strict';
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  const isWishlist = document.documentElement.dataset.mistirView === 'wishlist';
  const destination = isWishlist ? './index.html' : './wishlist.html';
  let touch = null;
  let navigating = false;
  document.addEventListener('touchstart',function(event){
    touch=null;
    if(navigating || !event.touches || event.touches.length!==1)return;
    const target=event.target;
    if(!target || !target.closest)return;
    if(target.closest('input, textarea, select, button, a, label, dialog, [role="dialog"], [data-no-swipe], .wl-card-menu'))return;
    const p=event.touches[0];
    if(p.clientX<20 || p.clientX>window.innerWidth-20)return;
    touch={x:p.clientX,y:p.clientY,time:Date.now()};
  },{passive:true});
  document.addEventListener('touchcancel',function(){touch=null;},{passive:true});
  document.addEventListener('touchend',function(event){
    if(!touch||!event.changedTouches||!event.changedTouches.length)return;
    const start=touch;touch=null;
    const p=event.changedTouches[0];
    const dx=p.clientX-start.x,dy=p.clientY-start.y;
    const horizontal=isWishlist?dx>85:dx< -85;
    if(!horizontal || Math.abs(dx)<Math.abs(dy)*1.6 || Date.now()-start.time>1200)return;
    navigating=true;
    const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced)document.documentElement.classList.add('mistir-page-leaving-'+(isWishlist?'right':'left'));
    window.setTimeout(function(){window.location.assign(destination);},reduced?0:165);
  },{passive:true});
  // The existing demo API continues to work, but opens the dedicated route.
  if(!isWishlist && typeof window.listsUI==='function'){
    window.listsUI=function(){window.location.assign(destination);};
    window.showWishlist=function(){window.location.assign(destination+'#favorites');};
  }
  if(!isWishlist){
    window.addEventListener('pageshow',function(){
      // Restore favorites when returning from the separate page (including bfcache).
      try{
        const values=JSON.parse(localStorage.getItem('mistir-favorites')||'[]');
        if(Array.isArray(values) && typeof wishlist!=='undefined' && typeof products!=='undefined'){
          wishlist=[...new Set(values.filter(id=>products.some(p=>p.id===id)))];
          if(typeof render==='function')render();
        }
      }catch(_){}
    });
  }
})();