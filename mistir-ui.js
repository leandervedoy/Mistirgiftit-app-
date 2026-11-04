/* Mistir Gift – wishlist hub and product-to-checkout microinteractions */
(function () {
  'use strict';
  var overlay = document.getElementById('overlay');
  var modalBody = document.getElementById('modalbody');
  if (!overlay || !modalBody || typeof products === 'undefined') return;

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function updateCounts() {
    var favorited = wishlist.length;
    var listCount = giftState.lists.length;
    var count = cart.length;
    [['wishCount',favorited],['wishlistCount',favorited],['mobileWishCount',favorited],
     ['count',count],['mobileCartCount',count]].forEach(function (entry) {
      var el = document.getElementById(entry[0]);
      if (el) el.textContent = entry[1];
    });
    var label = document.getElementById('wishlistTrigger');
    if (label) label.setAttribute('aria-label', 'Ønskelister, '+ listCount +' lister og '+favorited+' favoritter');
    var cartButton = document.getElementById('cartTrigger');
    if (cartButton) cartButton.setAttribute('aria-label', 'Kassen, '+count+' produkter');
  }

  function decorateProducts() {
    document.querySelectorAll('.product .heart').forEach(function (el) {
      var match = (el.getAttribute('onclick') || '').match(/toggleWish\((\d+)\)/);
      if (!match) return;
      var id = Number(match[1]);
      var product = products.find(function(p){return p.id === id;});
      var selected = wishlist.includes(id);
      el.setAttribute('aria-pressed', selected ? 'true':'false');
      el.setAttribute('aria-label', (selected ? 'Fjern fra favoritter: ' : 'Lagre som favoritt: ') + (product ? product.name : 'produkt'));
      el.title = selected ? 'Fjern fra favoritter':'Lagre som favoritt';
    });
  }

  var originalRender = render;
  render = function () {
    originalRender();
    decorateProducts();
    updateCounts();
  };

  function cartDestination() {
    var mobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    var primary = document.getElementById(mobile ? 'mobileCartTrigger' : 'cartTrigger');
    var secondary = document.getElementById(mobile ? 'cartTrigger' : 'mobileCartTrigger');
    return primary || secondary;
  }

  function cartCelebrate() {
    var target = cartDestination();
    if (!target) return;
    if (reducedMotion()) return;
    target.classList.remove('cart-celebrate');
    void target.offsetWidth;
    target.classList.add('cart-celebrate');
    window.setTimeout(function(){target.classList.remove('cart-celebrate');}, 550);
  }

  function flyToCart(image) {
    var target = cartDestination();
    if (!target || !image || reducedMotion() || !image.animate) {
      cartCelebrate();
      return;
    }
    var from = image.getBoundingClientRect();
    var to = target.getBoundingClientRect();
    if (!from.width || !to.width) {
      cartCelebrate();
      return;
    }
    var size = Math.min(84, Math.max(52, from.width * .32));
    var x = from.left + from.width / 2 - size / 2;
    var y = from.top + from.height / 2 - size / 2;
    var dx = to.left + to.width / 2 - (x + size / 2);
    var dy = to.top + to.height / 2 - (y + size / 2);
    var ghost = image.cloneNode(false);
    ghost.className = 'fly-ghost';
    ghost.alt = '';
    ghost.setAttribute('aria-hidden','true');
    ghost.style.left = x+'px';
    ghost.style.top = y+'px';
    ghost.style.width = size+'px';
    ghost.style.height = size+'px';
    document.body.appendChild(ghost);
    var distance = Math.hypot(dx, dy);
    var lift = Math.min(125, Math.max(55, distance*.15));
    var duration = Math.round(Math.min(920, Math.max(610, distance*.65)));
    var animation = ghost.animate([
      {transform:'translate3d(0,0,0) scale(1) rotate(-4deg)',opacity:1,offset:0},
      {transform:'translate3d('+(dx*.46)+'px,'+(dy*.5-lift)+'px,0) scale(.75) rotate(9deg)',opacity:1,offset:.55},
      {transform:'translate3d('+dx+'px,'+dy+'px,0) scale(.18) rotate(14deg)',opacity:0.25,offset:1}
    ], {duration:duration,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
    var finished = false;
    function cleanUp() {
      if (finished) return;
      finished = true;
      ghost.remove();
      cartCelebrate();
    }
    animation.onfinish = cleanUp;
    animation.oncancel = cleanUp;
  }

  function favoriteBurst(button) {
    if (!button || reducedMotion() || !button.animate) return;
    var rect = button.getBoundingClientRect();
    var heart = document.createElement('span');
    heart.className = 'fave-ghost';
    heart.textContent = '♥';
    heart.setAttribute('aria-hidden','true');
    heart.style.left = (rect.left + rect.width/2 - 13)+'px';
    heart.style.top = (rect.top + rect.height/2 - 17)+'px';
    document.body.appendChild(heart);
    var a = heart.animate([
      {transform:'scale(.6) translateY(0)',opacity:0},
      {transform:'scale(1.1) translateY(-10px)',opacity:1,offset:.35},
      {transform:'scale(.9) translateY(-35px)',opacity:0}
    ], {duration:550,easing:'ease-out',fill:'forwards'});
    a.onfinish = function(){heart.remove();};
    a.oncancel = function(){heart.remove();};
  }

  var clickedAddImage = null;
  var clickedHeart = null;
  document.addEventListener('click', function(event){
    var button = event.target.closest('button');
    if (!button) return;
    var action = button.getAttribute('onclick') || '';
    if (/^add\(/.test(action)) {
      var card = button.closest('.product');
      clickedAddImage = card ? card.querySelector('.photo img') : (button.closest('.modal') && button.closest('.modal').querySelector('img'));
    }
    if (/^toggleWish\(/.test(action)) clickedHeart = button;
  }, true);

  var originalAdd = add;
  add = function(id) {
    var source = clickedAddImage;
    clickedAddImage = null;
    if (source) flyToCart(source);
    else cartCelebrate();
    originalAdd(id);
    updateCounts();
  };

  var originalToggleWish = toggleWish;
  toggleWish = function(id) {
    var newlySaved = !wishlist.includes(id);
    if (newlySaved) favoriteBurst(clickedHeart);
    clickedHeart = null;
    originalToggleWish(id);
    render();
  };

  var originalModal = modal;
  modal = function(content) {
    originalModal(content);
    var dialog = overlay.querySelector('.modal');
    if (dialog) {
      dialog.setAttribute('role','dialog');
      dialog.setAttribute('aria-modal','true');
      dialog.setAttribute('aria-label','Mistir Gift');
    }
  };
  document.addEventListener('keydown',function(event) {
    if (event.key === 'Escape' && overlay.style.display === 'flex') hide();
  });

  function lengthOfList(list) {
    return Array.isArray(list.ids) ? list.ids.length : 0;
  }
  function listTotal(list) {
    return (Array.isArray(list.ids) ? list.ids : []).reduce(function(sum,id) {
      var item = products.find(function(p){ return p.id===id; });
      return sum + (item ? item.price : 0);
    },0);
  }

  listsUI = function() {
    var content = '<div class="eyebrow">DINE GAVER</div><h2>Ønskelister ♡</h2>' +
      '<p class="wish-lede">Alle gavene du ønsker deg, samlet på ett sted. Trykk på hjertet ved et produkt for å lagre det.</p>' +
      '<div class="wish-overview">' +
       '<button class="wish-summary" data-wish-action="favorites"><strong>♡ '+wishlist.length+'</strong><small>Mine favoritter – se produkter</small></button>' +
       '<div class="wish-summary"><strong>'+giftState.lists.length+'</strong><small>Lagrede ønskelister</small></div>' +
      '</div>' +
      '<div class="wish-create"><label for="wishListName">Opprett ny ønskeliste</label><div class="rowline">' +
       '<input id="wishListName" maxlength="70" placeholder="F.eks. Bursdag eller jul">' +
       '<button class="btn" data-wish-action="create">Opprett</button></div>' +
       '<label class="wish-check"><input type="checkbox" id="copyFavorites" '+(wishlist.length?'checked':'')+'> Ta med mine favoritter</label></div>' +
      '<div class="wish-section-title">Mine lister</div>';
    if (!giftState.lists.length) content += '<div class="wish-empty">Du har ingen lister ennå. Lag en liste ovenfor, eller trykk ♡ på en gave du liker.</div>';
    giftState.lists.forEach(function(list, index) {
      content += '<article class="wish-card"><div class="wish-card-head"><div><h3>'+safe(list.name)+'</h3>' +
        '<p>'+lengthOfList(list)+' produkter · '+kr(listTotal(list))+'</p></div><span aria-hidden="true">💝</span></div>' +
        '<div class="wish-actions">' +
         '<button class="btn" data-wish-action="edit" data-index="'+index+'">Administrer</button>' +
         '<button class="btn outline" data-wish-action="rename" data-index="'+index+'">Endre navn</button>' +
         '<button class="btn outline" data-wish-action="share" data-index="'+index+'">Del</button>' +
         '<button class="btn outline" data-wish-action="duplicate" data-index="'+index+'">Kopier</button>' +
         '<button class="btn outline" data-wish-action="delete" data-index="'+index+'">Slett</button>' +
        '</div></article>';
    });
    content += '<p class="note">Demo: Ønskelister lagres på denne enheten. Innlogging og synkronisering mellom enheter er ikke aktivert.</p>';
    modal(content);
    updateCounts();
  };

  saveList = function() {
    var input = document.getElementById('wishListName');
    var name = input && input.value.trim();
    if (!name) { toast('Skriv navn på ønskelisten'); if(input)input.focus(); return; }
    var include = document.getElementById('copyFavorites');
    giftState.lists.push({name:name.slice(0,70), ids:include && include.checked ? Array.from(new Set(wishlist)) : []});
    persistGift();
    listsUI();
    toast('Ønskeliste opprettet');
  };

  showWishlist = function() {
    var content = '<button class="wishback" data-wish-action="lists">← Alle ønskelister</button>' +
      '<h2>Mine favoritter ♡</h2><p class="wish-lede">Dette er produktene du har lagret med hjertet. Legg dem til i en ønskeliste eller i handlekurven.</p>';
    if (!wishlist.length) {
      content += '<div class="wish-empty">Ingen favoritter ennå. Trykk ♡ på produktene du liker, så finner du dem her.</div>';
    } else {
      wishlist.forEach(function(id) {
        var p = products.find(function(product){return product.id===id;});
        if (!p) return;
        content += '<div class="wish-row" data-wish-product="'+id+'"><img src="'+p.image+'" alt="">' +
          '<div class="wish-row-main"><strong>'+safe(p.name)+'</strong><p class="note">'+kr(p.price)+'</p>' +
          '<div class="wish-row-actions"><button class="btn" data-wish-action="add-cart" data-product="'+id+'">Til kassen</button>' +
          '<button class="btn outline" data-wish-action="remove-favorite" data-product="'+id+'">Fjern ♡</button></div>';
        if (giftState.lists.length) {
          content += '<div class="wish-row-actions" style="margin-top:9px"><select aria-label="Velg ønskeliste" class="wish-select">' +
            giftState.lists.map(function(list,i){return '<option value="'+i+'">'+safe(list.name)+'</option>';}).join('') +
            '</select><button class="btn outline" data-wish-action="add-list" data-product="'+id+'">Legg i liste</button></div>';
        } else {
          content += '<div class="note" style="margin-top:8px">Opprett en liste for å organisere favorittene.</div>';
        }
        content += '</div></div>';
      });
    }
    content += '<div class="wish-actions"><button class="btn outline" data-wish-action="lists">Administrer ønskelister</button></div>';
    modal(content);
  };

  modalBody.addEventListener('click',function(event) {
    var button = event.target.closest('button[data-wish-action]');
    if (!button) return;
    var action = button.getAttribute('data-wish-action');
    var index = Number(button.getAttribute('data-index'));
    var id = Number(button.getAttribute('data-product'));
    if (action === 'lists') return listsUI();
    if (action === 'favorites') return showWishlist();
    if (action === 'create') return saveList();
    if (action === 'edit') return editList(index);
    if (action === 'rename') return renameWishList(index);
    if (action === 'share') return shareList(index);
    if (action === 'duplicate') return copyWishList(index);
    if (action === 'delete') return deleteWishList(index);
    if (action === 'remove-favorite') {
      toggleWish(id);
      showWishlist();
      toast('Fjernet fra favoritter');
    }
    if (action === 'add-cart') {
      var row = button.closest('.wish-row');
      clickedAddImage = row && row.querySelector('img');
      add(id);
      toast('Lagt i handlekurven');
    }
    if (action === 'add-list') {
      var item = button.closest('.wish-row');
      var picker = item && item.querySelector('select.wish-select');
      if (!picker) return toast('Opprett en ønskeliste først');
      var list = giftState.lists[Number(picker.value)];
      if (!list) return toast('Velg en ønskeliste');
      if (!Array.isArray(list.ids)) list.ids = [];
      if (list.ids.includes(id)) return toast('Produktet er allerede i listen');
      list.ids.push(id);
      persistGift();
      toast('Lagt til i '+list.name);
      updateCounts();
    }
  });

  /* Enter on the list name input creates the list. */
  modalBody.addEventListener('keydown',function(event){
    if (event.key === 'Enter' && event.target.id === 'wishListName') {
      event.preventDefault();
      saveList();
    }
  });

  render();
})();
