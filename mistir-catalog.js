/* Mistir Gift shared demo catalog; used by store and wishlist. */
(function (global) {
 'use strict';
 const products=[
{id:1,name:'Keramikkopp i naturtoner',category:'Hjem & kos',price:249,image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&q=80'},
{id:2,name:'Duftlys – varm vanilje',category:'Hjem & kos',price:299,image:'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=700&q=80'},
{id:3,name:'Eksklusiv notatbok',category:'Personlig',price:199,image:'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=700&q=80'},
{id:4,name:'Myk bamse til noen du er glad i',category:'Til barn',price:229,image:'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=700&q=80'},
{id:5,name:'Klassisk armbåndsur',category:'Til ham',price:699,image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80'},
{id:6,name:'Blomsterbukett i pastell',category:'Til henne',price:349,image:'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700&q=80'},
{id:7,name:'Gaveeske med kaffe',category:'Mat & drikke',price:399,image:'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=700&q=80'},
{id:8,name:'Hudpleie og velvære',category:'Velvære',price:449,image:'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=80'}
];function productArt(p){let colors=['#e6c6b4','#e7d7a6','#c9d6d0','#dfc8dc','#bfcfdf','#e3c6ca','#d9c4a6','#c8d6c5'];let icons=['☕','🕯','📓','🧸','⌚','💐','🎁','🧴'];let n=(p.id-1)%8;let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${colors[n]}"/><stop offset="1" stop-color="#f8f2e9"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="300" cy="270" r="178" fill="#ffffff" opacity=".35"/><text x="300" y="355" text-anchor="middle" font-size="190">${icons[n]}</text><text x="300" y="530" text-anchor="middle" font-size="24" font-family="sans-serif" fill="#51463c">GAVEIDÉ · DEMO</text></svg>`;return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg)}products.forEach(p=>p.image=productArt(p));
 global.MistirCatalog = Object.freeze({ products: products });
})(window);
