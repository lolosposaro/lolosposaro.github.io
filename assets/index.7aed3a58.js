import{S as o,P as n,W as e,T as t,M as i,a as r,b as s,A as a,c as d,B as c,d as l,e as p,f as w}from"./vendor.c6840619.js";!function(){const o=document.createElement("link").relList;if(!(o&&o.supports&&o.supports("modulepreload"))){for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver((o=>{for(const e of o)if("childList"===e.type)for(const o of e.addedNodes)"LINK"===o.tagName&&"modulepreload"===o.rel&&n(o)})).observe(document,{childList:!0,subtree:!0})}function n(o){if(o.ep)return;o.ep=!0;const n=function(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerpolicy&&(n.referrerPolicy=o.referrerpolicy),"use-credentials"===o.crossorigin?n.credentials="include":"anonymous"===o.crossorigin?n.credentials="omit":n.credentials="same-origin",n}(o);fetch(o.href,n)}}();const u=new o,m=new n(75,window.innerWidth/window.innerHeight,.1,1e3),f=new e({canvas:document.querySelector("#bg")});f.setPixelRatio(window.devicePixelRatio),f.setSize(window.innerWidth,window.innerHeight),m.position.setZ(30),m.position.setX(-3),f.render(u,m);const g=new t(10,3,16,100),y=new i({color:16737095}),h=new r(g,y);u.add(h);const b=new s(16777215);b.position.set(5,5,5);const x=new a(16777215);u.add(b,x),Array(150).fill().forEach((function(){const o=new p(.25,24,24),n=new i({color:16777215}),e=new r(o,n),[t,s,a]=Array(3).fill().map((()=>w.randFloatSpread(100)));e.position.set(t,s,a),u.add(e)}));const z=(new d).load("img/space.jpg");u.background=z;const v=(new d).load("img/lolo.png"),A=new r(new c(3,3,3),new l({map:v}));u.add(A);const S=(new d).load("img/moon.jpg"),j=(new d).load("img/normal.jpg"),L=new r(new p(3,32,32),new i({map:S,normalMap:j}));function P(){const o=document.body.getBoundingClientRect().top;L.rotation.x+=.01,L.rotation.y+=.02,L.rotation.z+=.01,A.rotation.y+=.01,A.rotation.z+=.01,m.position.z=-.01*o,m.position.x=-2e-4*o,m.rotation.y=-2e-4*o}u.add(L),L.position.z=30,L.position.setX(-10),A.position.z=-5,A.position.x=2,document.body.onscroll=P,P(),function o(){requestAnimationFrame(o),h.rotation.x+=.007,h.rotation.y+=.005,h.rotation.z+=.007,L.rotation.x+=.005,f.render(u,m)}();