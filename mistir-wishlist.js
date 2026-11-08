/* Mistir Gift wishlists: dedicated screen, compatible with existing local data. */
(function () {
  'use strict';
  const STORE_KEY = 'mistir-gift-demo-v2';
  const FAVORITES_KEY = 'mistir-favorites';
  const products = window.MistirCatalog && window.MistirCatalog.products;
  if (!Array.isArray(products)) return;
  const productMap = new Map(products.map(p => [p.id, p]));
  const byId = id => productMap.get(Number(id));
  const $ = id => document.getElementById(id);
  const nodes = {
    grid: $('listsGrid'), favorites: $('favoritesGrid'),
    emptyLists: $('emptyLists'), emptyFavorites: $('emptyFavorites'),
    listsView: $('listsView'), favoritesView: $('favoritesView'), detail: $('detailView'),
    listStat: $('listStat'), favoriteStat: $('favoriteStat'), savedStat: $('savedStat'),
    create: $('createListForm'), input: $('newListName'),
    picker: $('favoritePicker'), pickerChoices: $('favoritePickerChoices')
  };
  if (!nodes.grid || !nodes.create) return;

  let saved = {};
  let favorites = [];
  let activeTab = 'lists';
  let detailIndex = null;
  let addingFavoriteId = null;
  let toastTimeout;

  const text = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
  function uniqueValid(ids) {
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids.map(Number).filter(id => Number.isInteger(id) && productMap.has(id)))];
  }
  function load() {
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (_) { saved = {}; }
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
    if (!Array.isArray(saved.lists)) saved.lists = [];
    saved.lists = saved.lists.filter(l => l && typeof l.name === 'string' && Array.isArray(l.ids))
      .map(l => ({ ...l, name: l.name.trim().slice(0,70), ids: uniqueValid(l.ids) }));
    try { favorites = uniqueValid(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
    catch (_) { favorites = []; }
    if (detailIndex !== null && !saved.lists[detailIndex]) detailIndex = null;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); return true; }
    catch (_) { notice('Kunne ikke lagre listen på denne enheten.'); return false; }
  }
  function persistFavorites() {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); return true; }
    catch (_) { notice('Kunne ikke lagre favoritter.'); return false; }
  }
  function notice(message) {
    const el = $('wishToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('is-visible'), 2800);
  }
  function countLabel(n) { return n + (n === 1 ? ' gave' : ' gaver'); }
  function kr(n) { return n.toLocaleString('nb-NO') + ' kr'; }
  function listEmoji(name) {
    const n = name.toLocaleLowerCase('nb-NO');
    if (n.includes('jul')) return '🎄';
    if (n.includes('bursdag')) return '🎂';
    if (n.includes('bryllup')) return '💍';
    if (n.includes('baby')) return '🧸';
    return '🎁';
  }
  function paintStats() {
    const all = [...new Set(saved.lists.flatMap(list => list.ids))];
    nodes.listStat.textContent = saved.lists.length;
    nodes.favoriteStat.textContent = favorites.length;
    nodes.savedStat.textContent = all.length;
    $('tabListsCount').textContent = saved.lists.length;
    $('tabFavoritesCount').textContent = favorites.length;
  }
  function renderLists() {
    nodes.grid.innerHTML = saved.lists.map((list, i) => {
      const items = uniqueValid(list.ids).map(byId).filter(Boolean);
      const peek = items.length
        ? items.slice(0,3).map(p => '<img src="'+p.image+'" alt="">').join('')
        : '<span class="wl-peek-empty">Ingen gaver valgt ennå. Trykk Åpne for å legge til.</span>';
      return '<article class="wl-list-card">' +
        '<div class="wl-card-top"><span class="wl-card-icon" aria-hidden="true">'+listEmoji(list.name)+'</span>' +
        '<details class="wl-card-menu"><summary aria-label="Flere valg for '+text(list.name)+'">···</summary>' +
        '<div class="wl-card-menu-items">' +
        '<button type="button" data-action="rename" data-index="'+i+'">Gi nytt navn</button>' +
        '<button type="button" data-action="duplicate" data-index="'+i+'">Lag kopi</button>' +
        '<button class="wl-danger" type="button" data-action="delete" data-index="'+i+'">Slett liste</button>' +
        '</div></details></div>' +
        '<div><h3>'+text(list.name)+'</h3><p class="wl-list-meta">'+countLabel(items.length)+' · '+kr(items.reduce((n,p)=>n+p.price,0))+' totalt</p></div>' +
        '<div class="wl-product-peek">'+peek+'</div>' +
        '<div class="wl-card-actions"><button type="button" class="wl-open-btn" data-action="open" data-index="'+i+'">Åpne liste</button>' +
        '<button type="button" data-action="share" data-index="'+i+'">↗ Del</button></div></article>';
    }).join('');
    nodes.emptyLists.hidden = saved.lists.length > 0;
  }
  function renderFavorites() {
    nodes.favorites.innerHTML = favorites.map(id => {
      const p = byId(id);
      if (!p) return '';
      return '<article class="wl-fav-card"><img src="'+p.image+'" alt="" loading="lazy">' +
        '<div class="wl-fav-body"><strong>'+text(p.name)+'</strong><small>'+text(p.category)+' · '+kr(p.price)+'</small>' +
        '<div class="wl-fav-actions"><button type="button" data-action="add-favorite" data-id="'+id+'">＋ Legg i liste</button>' +
        '<button type="button" data-action="remove-favorite" data-id="'+id+'">Fjern ♡</button></div></div></article>';
    }).join('');
    nodes.emptyFavorites.hidden = favorites.length > 0;
  }
  function renderDetail() {
    const list = saved.lists[detailIndex];
    if (!list) { detailIndex = null; showView(); return; }
    $('detailTitle').textContent = list.name;
    $('detailSubtitle').textContent = countLabel(list.ids.length) + ' · Velg gaver nedenfor';
    $('renameListForm').hidden = true;
    $('detailProducts').innerHTML = products.map(p =>
      '<label class="wl-picker-item"><img src="'+p.image+'" loading="lazy" alt="">' +
      '<span class="wl-picker-body"><strong>'+text(p.name)+'</strong><small>'+kr(p.price)+' · '+text(p.category)+'</small></span>' +
      '<input type="checkbox" data-product-toggle="'+p.id+'" aria-label="Legg til '+text(p.name)+'" '+(list.ids.includes(p.id)?'checked':'')+'></label>'
    ).join('');
  }
  function showView() {
    const detail = detailIndex !== null;
    nodes.detail.hidden = !detail;
    nodes.listsView.hidden = detail || activeTab !== 'lists';
    nodes.favoritesView.hidden = detail || activeTab !== 'favorites';
    const tabBar = document.querySelector('.wl-tabs');
    if (tabBar) tabBar.hidden = detail;
    const tabs = [{tab:'lists',button:$('tabLists')},{tab:'favorites',button:$('tabFavorites')}];
    tabs.forEach(({tab,button}) => {
      const selected = !detail && tab === activeTab;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if (detail) renderDetail();
  }
  function renderAll() { paintStats(); renderLists(); renderFavorites(); showView(); }
  function focusCreate() {
    detailIndex=null; activeTab='lists'; showView();
    nodes.create.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    nodes.input.focus({preventScroll:true});
  }
  function switchTab(tab) {
    if (tab!=='lists' && tab!=='favorites') return;
    detailIndex=null; activeTab=tab; showView();
  }
  function openList(index, rename) {
    if (!saved.lists[index]) return;
    detailIndex=index; activeTab='lists'; showView();
    if (rename) toggleRename(true);
    document.querySelector('.wl-collection').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function toggleRename(show) {
    if (detailIndex===null) return;
    const form=$('renameListForm');
    form.hidden=!show;
    if(show) { $('renameListName').value=saved.lists[detailIndex].name; $('renameListName').focus(); }
  }
  function create(event) {
    event.preventDefault();
    const name=nodes.input.value.trim().replace(/\s+/g,' ').slice(0,70);
    if(!name){ nodes.input.focus(); notice('Gi ønskelisten et navn.'); return; }
    const ids=$('includeFavorites').checked ? [...favorites] : [];
    saved.lists.push({name,ids,createdAt:new Date().toISOString()});
    if (!persist()) { saved.lists.pop(); return; }
    nodes.create.reset();
    $('includeFavorites').checked=true;
    renderAll();
    openList(saved.lists.length-1,false);
    notice('Ønskelisten er opprettet! Du kan legge til gaver nå.');
  }
  function updateListProduct(id, checked) {
    const list=saved.lists[detailIndex];
    if(!list || !byId(id))return;
    const before=[...list.ids];
    list.ids=checked ? [...new Set([...list.ids,id])] : list.ids.filter(value=>value!==id);
    if (!persist()) { list.ids=before; renderDetail(); return; }
    $('detailSubtitle').textContent=countLabel(list.ids.length)+' · Endringer lagret automatisk';
    paintStats();
    // The current checkbox stays focused, avoiding interruption on mobile.
  }
  function duplicateList(i) {
    const list=saved.lists[i];if(!list)return;
    saved.lists.push({name:(list.name+' (kopi)').slice(0,70),ids:[...list.ids],createdAt:new Date().toISOString()});
    if(!persist()){saved.lists.pop();return;}
    detailIndex=null;activeTab='lists';renderAll();notice('Kopi opprettet');
  }
  function deleteList(i) {
    const list=saved.lists[i];if(!list)return;
    if(!confirm('Vil du slette ønskelisten «'+list.name+'»? Dette kan ikke angres.'))return;
    const removed=saved.lists.splice(i,1)[0];
    if(!persist()){saved.lists.splice(i,0,removed);return;}
    detailIndex=null;renderAll();notice('Listen er slettet');
  }
  function shareList(i) {
    const list=saved.lists[i];if(!list)return;
    const url=new URL('./index.html',window.location.href);
    url.searchParams.set('wishlist',list.ids.join(','));
    url.searchParams.set('list',list.name);
    const link=url.toString();
    if(navigator.share){
      navigator.share({title:'Min ønskeliste: '+list.name,url:link}).catch(()=>{});
    } else if(navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(()=>notice('Delingslenken er kopiert')).catch(()=>prompt('Kopier ønskelisten:',link));
    } else prompt('Kopier ønskelisten:',link);
  }
  function assignFavorite(id,i) {
    const list=saved.lists[i];if(!list||!byId(id))return;
    if(list.ids.includes(id)){notice('Gaven ligger allerede i denne listen');}
    else {
      list.ids.push(id);
      if(!persist()){list.ids=list.ids.filter(value=>value!==id);return;}
      notice('Gaven er lagt til i «'+list.name+'»');
    }
    if(nodes.picker.open) nodes.picker.close();
    paintStats();renderLists();
  }
  function openFavoritePicker(id) {
    if(!byId(id))return;
    if(!saved.lists.length){switchTab('lists');focusCreate();notice('Lag en ønskeliste først');return;}
    addingFavoriteId=id;
    $('favoritePickerIntro').textContent='Velg en liste for '+byId(id).name+'.';
    nodes.pickerChoices.innerHTML=saved.lists.map((list,i)=>
      '<button type="button" data-action="assign-favorite" data-index="'+i+'" data-id="'+id+'">'+
      listEmoji(list.name)+' '+text(list.name)+'</button>'
    ).join('');
    if(typeof nodes.picker.showModal==='function')nodes.picker.showModal();
    else nodes.picker.setAttribute('open','');
  }
  nodes.create.addEventListener('submit',create);
  document.querySelectorAll('[data-template]').forEach(btn=>btn.addEventListener('click',()=>{
    nodes.input.value=btn.dataset.template;nodes.input.focus();
  }));
  $('emptyCreateButton').addEventListener('click',focusCreate);
  $('detailBack').addEventListener('click',()=>{
    detailIndex=null;activeTab='lists';renderAll();
  });
  $('cancelRename').addEventListener('click',()=>toggleRename(false));
  $('renameListForm').addEventListener('submit',event=>{
    event.preventDefault();
    const list=saved.lists[detailIndex];if(!list)return;
    const name=$('renameListName').value.trim().replace(/\s+/g,' ').slice(0,70);
    if(!name){notice('Gi listen et navn');return;}
    const before=list.name;list.name=name;
    if(!persist()){list.name=before;return;}
    renderAll();notice('Listen er oppdatert');
  });
  document.querySelector('.wl-tabs').addEventListener('click',event=>{
    const tab=event.target.closest('[data-tab]');
    if(tab)switchTab(tab.dataset.tab);
  });
  document.querySelector('.wl-tabs').addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();
    const next=activeTab==='lists'?'favorites':'lists';
    switchTab(next);
    $('tab'+(next==='lists'?'Lists':'Favorites')).focus();
  });
  $('detailProducts').addEventListener('change',event=>{
    const input=event.target.closest('[data-product-toggle]');
    if(input)updateListProduct(Number(input.dataset.productToggle),input.checked);
  });
  nodes.grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');
    if(!button)return;
    const i=Number(button.dataset.index);
    switch(button.dataset.action){
      case 'open':openList(i);break;
      case 'rename':openList(i,true);break;
      case 'duplicate':duplicateList(i);break;
      case 'delete':deleteList(i);break;
      case 'share':shareList(i);break;
    }
  });
  nodes.favorites.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const id=Number(button.dataset.id);
    if(button.dataset.action==='remove-favorite'){
      favorites=favorites.filter(x=>x!==id);persistFavorites();renderAll();notice('Fjernet fra favoritter');
    }else if(button.dataset.action==='add-favorite')openFavoritePicker(id);
  });
  nodes.pickerChoices.addEventListener('click',event=>{
    const button=event.target.closest('[data-action="assign-favorite"]');if(!button)return;
    assignFavorite(Number(button.dataset.id),Number(button.dataset.index));
  });
  document.querySelectorAll('[data-detail-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.detailAction;
    if(detailIndex===null)return;
    if(action==='share')shareList(detailIndex);
    if(action==='rename')toggleRename(true);
    if(action==='duplicate')duplicateList(detailIndex);
    if(action==='delete')deleteList(detailIndex);
  }));
  window.addEventListener('pageshow',()=>{load();renderAll();});
  window.addEventListener('storage',event=>{
    if(event.key===STORE_KEY||event.key===FAVORITES_KEY){load();renderAll();}
  });
  load();
  if(window.location.hash==='#favorites')activeTab='favorites';
  renderAll();
})();