const FontInjector = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0c; color: #e2e8f0; font-family: 'Outfit', sans-serif; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #111114; }
    ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #0ff8c0; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .heading { font-family: 'Rajdhani', sans-serif; }
    @keyframes pulse-teal { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes slideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    .anim-in { animation: slideIn 0.4s ease both; }
    .fade-in { animation: fadeIn 0.5s ease both; }
    .live-dot { animation: pulse-teal 1.5s ease-in-out infinite; }
    .blink { animation: blink 1s step-end infinite; }
    .hover-card { transition: all 0.2s ease; }
    .hover-card:hover { transform: translateY(-2px); }
    .btn-primary { transition: all 0.15s ease; }
    .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .tab-active { border-bottom: 2px solid #0ff8c0; color: #0ff8c0; }
  `}</style>
);

export default FontInjector;
