if(!self.define){let e,s={};const n=(n,r)=>(n=new URL(n+".js",r).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(r,i)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let l={};const t=e=>n(e,o),c={module:{uri:o},exports:l,require:t};s[o]=Promise.all(r.map((e=>c[e]||t(e)))).then((e=>(i(...e),l)))}}define(["./workbox-79ffe3e0"],(function(e){"use strict";e.setCacheNameDetails({prefix:"wotlkheals"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"css/app.a72a5e88.css",revision:null},{url:"css/chunk-vendors.c632c9ea.css",revision:null},{url:"index.html",revision:"217d83c96d398f1275d53b33edc81797"},{url:"js/app.a847d229.js",revision:null},{url:"js/chunk-vendors.2532419d.js",revision:null},{url:"manifest.json",revision:"e7ab44632d74a86ed8c8635d691b85c5"},{url:"robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{})}));
//# sourceMappingURL=service-worker.js.map
