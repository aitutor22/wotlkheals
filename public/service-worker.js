if(!self.define){let e,s={};const n=(n,r)=>(n=new URL(n+".js",r).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(r,i)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let c={};const l=e=>n(e,o),t={module:{uri:o},exports:c,require:l};s[o]=Promise.all(r.map((e=>t[e]||l(e)))).then((e=>(i(...e),c)))}}define(["./workbox-79ffe3e0"],(function(e){"use strict";e.setCacheNameDetails({prefix:"wotlkheals"}),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"css/app.d548c3fd.css",revision:null},{url:"css/chunk-vendors.1201686b.css",revision:null},{url:"index.html",revision:"6c53651b18a079f1fe8eadd2a18079c7"},{url:"js/app.e93af7cc.js",revision:null},{url:"js/chunk-vendors.4e3c04ab.js",revision:null},{url:"manifest.json",revision:"e7ab44632d74a86ed8c8635d691b85c5"},{url:"robots.txt",revision:"b6216d61c03e6ce0c9aea6ca7808f7ca"}],{})}));
//# sourceMappingURL=service-worker.js.map
