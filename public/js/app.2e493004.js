(function(){"use strict";var t={1909:function(t,o,e){var n=e(6265),a=e.n(n),i=e(6369),r=function(){var t=this,o=t._self._c;return o("div",{attrs:{id:"app"}},[o("nav",[o("router-link",{attrs:{to:"/"}},[t._v("Home")]),t._v(" | "),o("router-link",{attrs:{to:"/paladin/ttoom/"}},[t._v("Paladin")])],1),o("router-view")],1)},s=[],l=e(1001),u={},c=(0,l.Z)(u,r,s,!1,null,null,null),p=c.exports,m=e(9907);(0,m.z)("/service-worker.js",{ready(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered(){console.log("Service worker has been registered.")},cached(){console.log("Content has been cached for offline use.")},updatefound(){console.log("New content is downloading.")},updated(){console.log("New content is available; please refresh.")},offline(){console.log("No internet connection found. App is running in offline mode.")},error(t){console.error("Error during service worker registration:",t)}});var d=e(2631),f=function(){var t=this,o=t._self._c;return o("div",{staticClass:"container"},[t._v(" Under Construction ")])},v=[];const h={holyLight:{name:"Holy Light",description:["Heals a friendly target"],class:"paladin",direct:!0,hot:!1,ranks:[{rank:13,mana:1274.26,castTime:2.5,min:4888,max:5444,hotTick:0}]}};var g={name:"PaladinCalculator",props:{},data(){return{spellPower:2400,manaPool:28e3}},computed:{spells(){return h}},methods:{},mounted(){console.log("mounting")}},b=g,y=(0,l.Z)(b,f,v,!1,null,"29bd3571",null),O=y.exports,w=function(){var t=this,o=t._self._c;return o("div",{staticClass:"container"},[t.showExplanation?o("div",{staticClass:"row"},[o("p",[t._v("This is a general tool to visualise how long it takes for a Holy Paladin to go OOM, especially due to the high mana cost of Holy Light.")]),o("p",[t._v("The tool assumes the player incorporates slight pauses after every instant cast (e.g. HS) to allow for melee hits to proc Seal of Wisdom.")]),o("p",[t._v("Please input raid-buffed values for spellpower, mana pool, as well as your cast time for HL. If you select DMCG, you do not need to change the spellpower and mana pool as the system will automatically calculate it.")]),o("p",[t._v(" Special thanks to Lovelace and Currelius for formula help, as well as the rest of the healer cabal for valuable feedback and beta testing. ")])]):t._e(),o("div",{staticClass:"row"},[o("div",{staticClass:"col-4"},[o("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[o("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("Mana Pool")]),o("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["manaPool"],expression:"oomOptions['manaPool']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["manaPool"]},on:{input:function(o){o.target.composing||t.$set(t.oomOptions,"manaPool",t._n(o.target.value))},blur:function(o){return t.$forceUpdate()}}})]),o("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[o("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("HL Cast Time")]),o("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["castTimes"]["HOLY_LIGHT"],expression:"oomOptions['castTimes']['HOLY_LIGHT']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["castTimes"]["HOLY_LIGHT"]},on:{input:function(o){o.target.composing||t.$set(t.oomOptions["castTimes"],"HOLY_LIGHT",t._n(o.target.value))},blur:function(o){return t.$forceUpdate()}}})]),o("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[o("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("HS CPM ")]),o("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["holyShockCPM"],expression:"oomOptions['holyShockCPM']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["holyShockCPM"]},on:{input:function(o){o.target.composing||t.$set(t.oomOptions,"holyShockCPM",t._n(o.target.value))},blur:function(o){return t.$forceUpdate()}}})]),o("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[o("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("Avg hit from glyph HL")]),o("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["glyphHolyLightHits"],expression:"oomOptions['glyphHolyLightHits']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["glyphHolyLightHits"]},on:{input:function(o){o.target.composing||t.$set(t.oomOptions,"glyphHolyLightHits",t._n(o.target.value))},blur:function(o){return t.$forceUpdate()}}})]),o("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[o("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("MP5 From Gear & Buffs")]),o("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["mp5FromGearAndRaidBuffs"],expression:"oomOptions['mp5FromGearAndRaidBuffs']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["mp5FromGearAndRaidBuffs"]},on:{input:function(o){o.target.composing||t.$set(t.oomOptions,"mp5FromGearAndRaidBuffs",t._n(o.target.value))},blur:function(o){return t.$forceUpdate()}}})]),o("div",[o("button",{staticClass:"btn btn-primary",on:{click:t.runSim}},[t._v("Run Simulation")])])])])])},C=[],_={name:"PaladinTTOOM",props:{},data(){return{showExplanation:!0,oomOptions:{manaPool:28e3,castTimes:{HOLY_LIGHT:1.6},holyShockCPM:3,glyphHolyLightHits:4,mp5FromGearAndRaidBuffs:300}}},computed:{},methods:{runSim(){console.log("run sim"),a().post("ttoom/paladin",this.oomOptions).then((t=>{this.showExplanation=!1,console.log(t)}))}},mounted(){console.log("mounting")}},P=_,H=(0,l.Z)(P,w,C,!1,null,"997227d8",null),x=H.exports;i["default"].use(d.Z);const k=[{path:"/calculator/paladin",name:"paladin-calculator",component:O},{path:"/paladin/ttoom/",name:"paladin-ttoom",component:x},{path:"/",name:"home",component:O}],S=new d.Z({mode:"history",base:"/",routes:k});var L=S,T=e(3822);i["default"].use(T.ZP);var M=new T.ZP.Store({state:{},getters:{},mutations:{},actions:{},modules:{}}),G=e(5996),$=e(9425);e(7024);i["default"].use(G.XG7),i["default"].use($.A7),i["default"].config.productionTip=!1,a().defaults.baseURL="/api/",new i["default"]({router:L,store:M,render:t=>t(p)}).$mount("#app")}},o={};function e(n){var a=o[n];if(void 0!==a)return a.exports;var i=o[n]={exports:{}};return t[n](i,i.exports,e),i.exports}e.m=t,function(){var t=[];e.O=function(o,n,a,i){if(!n){var r=1/0;for(c=0;c<t.length;c++){n=t[c][0],a=t[c][1],i=t[c][2];for(var s=!0,l=0;l<n.length;l++)(!1&i||r>=i)&&Object.keys(e.O).every((function(t){return e.O[t](n[l])}))?n.splice(l--,1):(s=!1,i<r&&(r=i));if(s){t.splice(c--,1);var u=a();void 0!==u&&(o=u)}}return o}i=i||0;for(var c=t.length;c>0&&t[c-1][2]>i;c--)t[c]=t[c-1];t[c]=[n,a,i]}}(),function(){e.n=function(t){var o=t&&t.__esModule?function(){return t["default"]}:function(){return t};return e.d(o,{a:o}),o}}(),function(){e.d=function(t,o){for(var n in o)e.o(o,n)&&!e.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:o[n]})}}(),function(){e.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"===typeof window)return window}}()}(),function(){e.o=function(t,o){return Object.prototype.hasOwnProperty.call(t,o)}}(),function(){e.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}}(),function(){var t={143:0};e.O.j=function(o){return 0===t[o]};var o=function(o,n){var a,i,r=n[0],s=n[1],l=n[2],u=0;if(r.some((function(o){return 0!==t[o]}))){for(a in s)e.o(s,a)&&(e.m[a]=s[a]);if(l)var c=l(e)}for(o&&o(n);u<r.length;u++)i=r[u],e.o(t,i)&&t[i]&&t[i][0](),t[i]=0;return e.O(c)},n=self["webpackChunkfrontend"]=self["webpackChunkfrontend"]||[];n.forEach(o.bind(null,0)),n.push=o.bind(null,n.push.bind(n))}();var n=e.O(void 0,[998],(function(){return e(1909)}));n=e.O(n)})();
//# sourceMappingURL=app.2e493004.js.map