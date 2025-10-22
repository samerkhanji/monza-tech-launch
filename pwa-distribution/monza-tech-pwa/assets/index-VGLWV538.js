import{u as y,r as n,t as c,j as e,bK as b,C as l,d,e as m,b0 as k,f as g,L as v,I as j,h as N,aG as w}from"./index-D4jk50_k.js";const E=()=>{const[u]=y(),[s,p]=n.useState(""),[a,h]=n.useState(!1);n.useEffect(()=>{const t=u.get("track");t&&(p(t),a&&window.YQV5&&setTimeout(()=>{o()},500))},[u,a]),n.useEffect(()=>{const t=document.createElement("style");t.innerHTML=`
      /* Block only advertisement frames and banners */
      iframe[src*="googlesyndication"], 
      iframe[src*="doubleclick"],
      iframe[src*="adsystem"], 
      iframe[src*="googleadservices"],
      iframe[src*="ads."],
      div[id*="google_ads"], 
      .adsbygoogle, 
      .ad-container, 
      .advertisement, 
      .ad-banner,
      [class*="ad-block"],
      [id*="ad-block"],
      /* Block floating ad overlays */
      div[style*="position: fixed"][style*="z-index: 999"]:not(#YQContainer),
      div[style*="position: absolute"][style*="top: 0"]:not(#YQContainer *),
      /* Block common ad networks */
      iframe[src*="amazon-adsystem"],
      iframe[src*="media.net"],
      iframe[src*="outbrain"],
      iframe[src*="taboola"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Ensure tracking container remains visible and functional */
      #YQContainer {
        background: transparent !important;
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Allow legitimate tracking content */
      #YQContainer iframe:not([src*="ads"]):not([src*="googlesyndication"]),
      #YQContainer div:not([class*="ad"]):not([id*="ad"]) {
        display: block !important;
        visibility: visible !important;
      }
    `,document.head.appendChild(t);const r=document.createElement("script");return r.src="//www.17track.net/externalcall.js",r.type="text/javascript",r.async=!0,r.onload=()=>{h(!0),console.log("17track script loaded successfully"),setTimeout(()=>{const i=document.getElementById("YQContainer");i&&(i.querySelectorAll('iframe[src*="ads"], iframe[src*="googlesyndication"], [class*="advertisement"], [id*="google_ads"]').forEach(f=>f.remove()),console.log("Removed ad elements from tracking container"))},2e3)},r.onerror=()=>{console.error("Failed to load 17track script"),c({title:"Error",description:"Failed to load tracking service. Please try again later.",variant:"destructive"})},document.head.appendChild(r),()=>{const i=document.querySelector('script[src="//www.17track.net/externalcall.js"]');i&&document.head.removeChild(i),document.head.contains(t)&&document.head.removeChild(t)}},[]);const o=n.useCallback(async()=>{if(!s.trim()){c({title:"Validation Error",description:"Please enter a tracking number.",variant:"destructive"});return}if(!a||!window.YQV5){c({title:"Service Unavailable",description:"Tracking service is still loading. Please try again in a moment.",variant:"destructive"});return}try{console.log("Initiating tracking for:",s),window.YQV5.trackSingle({YQ_ContainerId:"YQContainer",YQ_Height:560,YQ_Fc:"0",YQ_Lang:"en",YQ_Num:s.trim()}),c({title:"Tracking Initiated",description:`Tracking package: ${s}`}),setTimeout(()=>{const t=document.getElementById("YQContainer");t&&t.querySelectorAll('iframe[src*="ads"], iframe[src*="googlesyndication"], [class*="advertisement"]').forEach(i=>i.remove())},3e3)}catch(t){console.error("Tracking error:",t),c({title:"Tracking Error",description:"Failed to initiate tracking. Please try again.",variant:"destructive"})}},[s,a]),x=t=>{t.key==="Enter"&&o()};return e.jsxs("div",{className:"container mx-auto py-6 space-y-6",children:[e.jsx("div",{className:"flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",children:e.jsxs("div",{children:[e.jsxs("h1",{className:"text-2xl font-bold tracking-tight flex items-center gap-2",children:[e.jsx(b,{className:"h-6 w-6"}),"Shipping ETA & Tracking"]}),e.jsx("p",{className:"text-muted-foreground mt-1",children:"Track shipments and monitor delivery estimates for incoming parts"})]})}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[e.jsxs(l,{children:[e.jsx(d,{children:e.jsxs(m,{className:"flex items-center gap-2",children:[e.jsx(k,{className:"h-5 w-5"}),"Track Shipment"]})}),e.jsxs(g,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{htmlFor:"tracking-number",children:"Tracking Number"}),e.jsx(j,{id:"tracking-number",type:"text",placeholder:"Enter tracking number...",value:s,onChange:t=>p(t.target.value),onKeyPress:x,maxLength:50,className:"w-full"})]}),e.jsxs(N,{onClick:o,className:"w-full",disabled:!a,children:[e.jsx(w,{className:"mr-2 h-4 w-4"}),a?"TRACK SHIPMENT":"Loading..."]}),!a&&e.jsx("p",{className:"text-sm text-muted-foreground text-center",children:"Loading tracking service..."})]})]}),e.jsxs(l,{children:[e.jsx(d,{children:e.jsx(m,{children:"Shipping Information"})}),e.jsxs(g,{className:"space-y-4",children:[e.jsxs("div",{className:"bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md",children:[e.jsx("h3",{className:"font-medium mb-2",children:"Supported Carriers"}),e.jsx("p",{className:"text-sm",children:"This tracking system supports most major carriers including DHL, FedEx, UPS, USPS, China Post, and many others worldwide."})]}),e.jsxs("div",{className:"bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md",children:[e.jsx("h3",{className:"font-medium mb-2",children:"Auto-Detection"}),e.jsx("p",{className:"text-sm",children:"The system automatically detects the carrier based on your tracking number format."})]}),e.jsxs("div",{className:"bg-green-50 border border-green-200 text-green-800 p-4 rounded-md",children:[e.jsx("h3",{className:"font-medium mb-2",children:"Real-Time Updates"}),e.jsx("p",{className:"text-sm",children:"Track your shipments in real-time and get detailed delivery information including estimated arrival times."})]})]})]})]}),e.jsxs(l,{children:[e.jsx(d,{children:e.jsx(m,{children:"Tracking Results"})}),e.jsx(g,{children:e.jsx("div",{id:"YQContainer",className:"min-h-[560px] w-full border rounded-md p-4 bg-gray-50",children:e.jsx("p",{className:"text-center text-muted-foreground",children:'Enter a tracking number above and click "TRACK SHIPMENT" to see detailed tracking information here.'})})})]})]})};export{E as default};
