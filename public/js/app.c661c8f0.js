(function(){"use strict";var t={3465:function(t,e,o){var s=o(6265),i=o.n(s),a=o(6369),n=function(){var t=this,e=t._self._c;return e("div",{attrs:{id:"app"}},[e("nav",[e("router-link",{attrs:{to:"/"}},[t._v("Home")]),t._v(" | "),e("router-link",{attrs:{to:"/paladin/ttoom/"}},[t._v("Paladin")])],1),e("router-view")],1)},r=[],l=o(1001),c={},u=(0,l.Z)(c,n,r,!1,null,null,null),m=u.exports,d=o(9907);(0,d.z)("service-worker.js",{ready(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered(){console.log("Service worker has been registered.")},cached(){console.log("Content has been cached for offline use.")},updatefound(){console.log("New content is downloading.")},updated(){console.log("New content is available; please refresh.")},offline(){console.log("No internet connection found. App is running in offline mode.")},error(t){console.error("Error during service worker registration:",t)}});var p=o(2631),h=function(){var t=this,e=t._self._c;return e("div",{staticClass:"container"},[t._v(" Under Construction ")])},f=[];const v={holyLight:{name:"Holy Light",description:["Heals a friendly target"],class:"paladin",direct:!0,hot:!1,ranks:[{rank:13,mana:1274.26,castTime:2.5,min:4888,max:5444,hotTick:0}]}};var g={name:"PaladinCalculator",props:{},data(){return{spellPower:2400,manaPool:28e3}},computed:{spells(){return v}},methods:{},mounted(){console.log("mounting")}},b=g,y=(0,l.Z)(b,h,f,!1,null,"29bd3571",null),k=y.exports,x=function(){var t=this,e=t._self._c;return e("div",{staticClass:"container"},[t.showExplanation?e("div",{staticClass:"row"},[e("p",[t._v(" This tool simulates how long it takes for a Holy Paladin to go OOM (ttoom), especially due to the high mana cost of Holy Light. Given the high number of procs in the hpld toolkit, the tool simulates 300 runs and returns the median ttoom, and the specific statistics from that run. ")]),e("p",[t._v("The tool assumes the player incorporates slight pauses after every instant cast (e.g. HS) to allow for melee hits to proc Seal of Wisdom.")]),e("p",[t._v("Please input raid-buffed values for spellpower, mana pool and crit chance (do not add crit from talents). Note: do not change stats from trinkets to these values as the tool will automatically calculate it.")]),e("p",[t._v(" Special thanks to Lovelace and Currelius for formula help, as well as the rest of the healer cabal for valuable feedback and beta testing. ")])]):t._e(),e("div",{staticClass:"row"},[e("div",{staticClass:"col-4"},[e("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[e("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("Mana Pool")]),e("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["manaPool"],expression:"oomOptions['manaPool']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["manaPool"]},on:{input:function(e){e.target.composing||t.$set(t.oomOptions,"manaPool",t._n(e.target.value))},blur:function(e){return t.$forceUpdate()}}})]),e("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[e("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("HL Cast Time")]),e("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["castTimes"]["HOLY_LIGHT"],expression:"oomOptions['castTimes']['HOLY_LIGHT']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["castTimes"]["HOLY_LIGHT"]},on:{input:function(e){e.target.composing||t.$set(t.oomOptions["castTimes"],"HOLY_LIGHT",t._n(e.target.value))},blur:function(e){return t.$forceUpdate()}}})]),e("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[e("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("HS CPM ")]),e("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["holyShockCPM"],expression:"oomOptions['holyShockCPM']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["holyShockCPM"]},on:{input:function(e){e.target.composing||t.$set(t.oomOptions,"holyShockCPM",t._n(e.target.value))},blur:function(e){return t.$forceUpdate()}}})]),e("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[e("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("Avg hit from glyph HL")]),e("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["glyphHolyLightHits"],expression:"oomOptions['glyphHolyLightHits']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["glyphHolyLightHits"]},on:{input:function(e){e.target.composing||t.$set(t.oomOptions,"glyphHolyLightHits",t._n(e.target.value))},blur:function(e){return t.$forceUpdate()}}})]),e("div",{staticClass:"input-group mb-2",staticStyle:{width:"100%"}},[e("span",{staticClass:"input-group-text",attrs:{id:"basic-addon1"}},[t._v("MP5 From Gear & Buffs")]),e("input",{directives:[{name:"model",rawName:"v-model.number",value:t.oomOptions["mp5FromGearAndRaidBuffs"],expression:"oomOptions['mp5FromGearAndRaidBuffs']",modifiers:{number:!0}}],staticClass:"form-control",attrs:{type:"text"},domProps:{value:t.oomOptions["mp5FromGearAndRaidBuffs"]},on:{input:function(e){e.target.composing||t.$set(t.oomOptions,"mp5FromGearAndRaidBuffs",t._n(e.target.value))},blur:function(e){return t.$forceUpdate()}}})]),e("div",[e("button",{staticClass:"btn btn-primary",on:{click:t.runSim}},[t._v(" "+t._s(t.fetching?"Loading...":"Run Simulation")+" ")])])]),e("div",{staticClass:"col-4"},[e("b",[t._v("Trinkets")]),e("div",{staticClass:"form-check"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.oomOptions["trinkets"],expression:"oomOptions['trinkets']"}],staticClass:"form-check-input",attrs:{type:"checkbox",id:"soup",value:"soup"},domProps:{checked:Array.isArray(t.oomOptions["trinkets"])?t._i(t.oomOptions["trinkets"],"soup")>-1:t.oomOptions["trinkets"]},on:{change:function(e){var o=t.oomOptions["trinkets"],s=e.target,i=!!s.checked;if(Array.isArray(o)){var a="soup",n=t._i(o,a);s.checked?n<0&&t.$set(t.oomOptions,"trinkets",o.concat([a])):n>-1&&t.$set(t.oomOptions,"trinkets",o.slice(0,n).concat(o.slice(n+1)))}else t.$set(t.oomOptions,"trinkets",i)}}}),e("label",{staticClass:"form-check-label",attrs:{for:"soup"}},[t._v("Soul Preserver")])]),e("div",{staticClass:"form-check"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.oomOptions["trinkets"],expression:"oomOptions['trinkets']"}],staticClass:"form-check-input",attrs:{type:"checkbox",id:"eog",value:"eog"},domProps:{checked:Array.isArray(t.oomOptions["trinkets"])?t._i(t.oomOptions["trinkets"],"eog")>-1:t.oomOptions["trinkets"]},on:{change:function(e){var o=t.oomOptions["trinkets"],s=e.target,i=!!s.checked;if(Array.isArray(o)){var a="eog",n=t._i(o,a);s.checked?n<0&&t.$set(t.oomOptions,"trinkets",o.concat([a])):n>-1&&t.$set(t.oomOptions,"trinkets",o.slice(0,n).concat(o.slice(n+1)))}else t.$set(t.oomOptions,"trinkets",i)}}}),e("label",{staticClass:"form-check-label",attrs:{for:"eog"}},[t._v("Eye of Gruul")])]),e("div",{staticClass:"form-check"},[e("input",{directives:[{name:"model",rawName:"v-model",value:t.oomOptions["trinkets"],expression:"oomOptions['trinkets']"}],staticClass:"form-check-input",attrs:{type:"checkbox",id:"dmcg",value:"dmcg"},domProps:{checked:Array.isArray(t.oomOptions["trinkets"])?t._i(t.oomOptions["trinkets"],"dmcg")>-1:t.oomOptions["trinkets"]},on:{change:function(e){var o=t.oomOptions["trinkets"],s=e.target,i=!!s.checked;if(Array.isArray(o)){var a="dmcg",n=t._i(o,a);s.checked?n<0&&t.$set(t.oomOptions,"trinkets",o.concat([a])):n>-1&&t.$set(t.oomOptions,"trinkets",o.slice(0,n).concat(o.slice(n+1)))}else t.$set(t.oomOptions,"trinkets",i)}}}),e("label",{staticClass:"form-check-label",attrs:{for:"dmcg"}},[t._v("Darkmoon Card: Greatness")])])])]),e("hr"),t.results?e("div",{staticClass:"row"},[e("div",{staticClass:"col-7"},[e("p",[t._v("Median Time to OOM: "),e("b",[t._v(t._s(t.results["ttoom"])+"s")])]),e("p",[t._v(" HPLD's ttoom has higher variance vs other healers due to Divine Plea breakpoints (amplified by using Darkmoon Card: Greatness). ")]),e("p",[t._v(" The bimodal distribution means a simple median/mean ttoom misses important context - you could have a high median ttoom but also be mana-screwed 30-40% of the time. The histogram (median in red) provides more contex, and you can click on bars to see the log on the right.")]),e("div",[e("input",{directives:[{name:"model",rawName:"v-model",value:t.minXAxis,expression:"minXAxis"}],attrs:{type:"text",name:""},domProps:{value:t.minXAxis},on:{input:function(e){e.target.composing||(t.minXAxis=e.target.value)}}}),e("input",{directives:[{name:"model",rawName:"v-model",value:t.maxXAxis,expression:"maxXAxis"}],attrs:{type:"text",name:""},domProps:{value:t.maxXAxis},on:{input:function(e){e.target.composing||(t.maxXAxis=e.target.value)}}}),e("button",{on:{click:function(e){t.isFixedAxis=!t.isFixedAxis}}},[t._v(" "+t._s(t.isFixedAxis?"Unfix Axis?":"Fix Axis?")+" ")])]),e("BarChart",{attrs:{"chart-data":t.chartData,"chart-options":t.chartOptions},on:{"on-receive":t.getLogOfClickedBar}})],1),e("div",{staticClass:"col-5"},[e("textarea",{directives:[{name:"model",rawName:"v-model",value:t.logs,expression:"logs"}],staticClass:"log",attrs:{readonly:""},domProps:{value:t.logs},on:{input:function(e){e.target.composing||(t.logs=e.target.value)}}})])]):t._e(),t.results?e("div",{staticClass:"row gap-top"},[e("br"),e("div",{staticClass:"col-5"},[e("h5",[t._v("Mana Generation Breakdown")]),e("b-table",{attrs:{striped:"",hover:"",items:t.mp5Data}})],1),e("div",{staticClass:"col-5 offset-2"},[e("h5",[t._v("Cast Profile")]),e("b-table",{attrs:{striped:"",hover:"",items:t.tableData}})],1),t._m(0)]):t._e()])},O=[function(){var t=this,e=t._self._c;return e("div",{staticClass:"pad-bottom"},[e("i",[t._v(" The above values for Cast Profile and Mana Generated are median values over 300 runs, and do not come from the same log. ")])])}],C=function(){var t=this,e=t._self._c;return e("Bar",{attrs:{"chart-options":t.chartOptions,"chart-data":t.chartData,"chart-id":t.chartId,"dataset-id-key":t.datasetIdKey,plugins:t.plugins,"css-classes":t.cssClasses,styles:t.styles,width:t.width,height:t.height}})},_=[],w=o(6294),A=o(741);A.kL.register(A.Dx,A.u,A.ZL,A.uw,A.f$);var P={name:"BarChart",components:{Bar:w.$Q},props:{chartId:{type:String,default:"bar-chart"},datasetIdKey:{type:String,default:"label"},chartData:{type:Object,default:()=>{}},chartOptions:{type:Object,default:()=>{}},chartValues:{type:Array,default:()=>[]},width:{type:Number,default:400},height:{type:Number,default:400},cssClasses:{default:"",type:String},styles:{type:Object,default:()=>{}},plugins:{type:Object,default:()=>{}}},computed:{test(){}},data(){return{}},methods:{handle(t,e){0!==e.length&&this.$emit("on-receive",{index:e[0].index})}}},L=P,S=(0,l.Z)(L,C,_,!1,null,null,null),H=S.exports,T={name:"PaladinTTOOM",props:{},data(){return{fetching:!1,showExplanation:!0,results:null,selectedLog:null,oomOptions:{manaPool:28e3,castTimes:{HOLY_LIGHT:1.6},trinkets:["soup","eog"],holyShockCPM:3,glyphHolyLightHits:4,mp5FromGearAndRaidBuffs:300},minXAxis:0,maxXAxis:0,isFixedAxis:!1}},components:{BarChart:H},computed:{logs(){if(this.selectedLog)return this.selectedLog.join("\n")},tableData(){let t=[];return t},mp5Data(){if(!this.results||"undefined"===typeof this.results["manaStatistics"])return;let t=[];for(let e=0;e<this.results["manaStatistics"].length;e++){let o=this.results["manaStatistics"][e];o["MP5"]=this.formatNumber(o["MP5"]),t.push(o)}return t},chartData(){if(this.results&&"undefined"!==typeof this.results["chartDetails"])return{labels:this.results["chartDetails"]["labels"],datasets:[{label:"Counts",backgroundColor:t(this.results["chartDetails"]["labels"].length,this.results["chartDetails"]["medianIndex"]),data:this.results["chartDetails"]["values"],barPercentage:1,categoryPercentage:1}]};function t(t,e){let o=[];for(let s=0;s<t;s++)o.push("#439af8");return o[e]="#f87979",o}},chartOptions(){if(this.results&&"undefined"!==typeof this.results["chartDetails"])return{responsive:!0,onClick:this.handle,scales:{x:{min:Number(this.minXAxis),max:Number(this.maxXAxis),type:"linear",title:{display:!0,text:"Time to OOM (s)"},ticks:{maxRotation:0,minRotation:0,stepSize:10}}}}}},methods:{formatNumber(t){return t.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1,")},runSim(){this.oomOptions["trinkets"].length>2?alert("You can only select up to two trinkets."):this.fetching||(this.fetching=!0,i().post("ttoom/paladin",this.oomOptions).then((t=>{this.fetching=!1,this.showExplanation=!1,console.log(t.data),this.results=t.data,this.selectedLog=t.data["logs"],this.isFixedAxis||(this.minXAxis=Number(this.results["chartDetails"]["minXAxis"]),this.maxXAxis=Number(this.results["chartDetails"]["maxXAxis"]))})).catch((t=>{console.log(t),this.fetching=!1})))},getLogOfClickedBar(t){let e=t["index"],o=this.results["chartDetails"]["exampleEntries"][e];this.fetching||(this.fetching=!0,i().post(`ttoom/paladin/${o.seed}`,this.oomOptions).then((t=>{this.fetching=!1,this.selectedLog=t.data})).catch((t=>{console.log(t),this.fetching=!1})))}},mounted(){console.log("mounting")}},$=T,N=(0,l.Z)($,x,O,!1,null,"27304a1d",null),D=N.exports;a["default"].use(p.Z);const M=[{path:"/calculator/paladin",name:"paladin-calculator",component:k},{path:"/paladin/ttoom/",name:"paladin-ttoom",component:D},{path:"/",name:"home",component:k}],G=new p.Z({mode:"history",base:"",routes:M});var X=G,B=o(3822);a["default"].use(B.ZP);var F=new B.ZP.Store({state:{},getters:{},mutations:{},actions:{},modules:{}}),j=o(5996),I=o(9425);o(7024);a["default"].use(j.XG7),a["default"].use(I.A7),a["default"].config.productionTip=!1,i().defaults.baseURL="/api/",new a["default"]({router:X,store:F,render:t=>t(m)}).$mount("#app")}},e={};function o(s){var i=e[s];if(void 0!==i)return i.exports;var a=e[s]={exports:{}};return t[s](a,a.exports,o),a.exports}o.m=t,function(){var t=[];o.O=function(e,s,i,a){if(!s){var n=1/0;for(u=0;u<t.length;u++){s=t[u][0],i=t[u][1],a=t[u][2];for(var r=!0,l=0;l<s.length;l++)(!1&a||n>=a)&&Object.keys(o.O).every((function(t){return o.O[t](s[l])}))?s.splice(l--,1):(r=!1,a<n&&(n=a));if(r){t.splice(u--,1);var c=i();void 0!==c&&(e=c)}}return e}a=a||0;for(var u=t.length;u>0&&t[u-1][2]>a;u--)t[u]=t[u-1];t[u]=[s,i,a]}}(),function(){o.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return o.d(e,{a:e}),e}}(),function(){o.d=function(t,e){for(var s in e)o.o(e,s)&&!o.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:e[s]})}}(),function(){o.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"===typeof window)return window}}()}(),function(){o.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}}(),function(){o.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}}(),function(){var t={143:0};o.O.j=function(e){return 0===t[e]};var e=function(e,s){var i,a,n=s[0],r=s[1],l=s[2],c=0;if(n.some((function(e){return 0!==t[e]}))){for(i in r)o.o(r,i)&&(o.m[i]=r[i]);if(l)var u=l(o)}for(e&&e(s);c<n.length;c++)a=n[c],o.o(t,a)&&t[a]&&t[a][0](),t[a]=0;return o.O(u)},s=self["webpackChunkfrontend"]=self["webpackChunkfrontend"]||[];s.forEach(e.bind(null,0)),s.push=e.bind(null,s.push.bind(s))}();var s=o.O(void 0,[998],(function(){return o(3465)}));s=o.O(s)})();
//# sourceMappingURL=app.c661c8f0.js.map