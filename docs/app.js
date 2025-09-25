/* global marked, DOMPurify */
(function(){
  const contentEl = document.getElementById('content');
  const tocEl = document.getElementById('toc');
  const searchEl = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const summaryToggle = document.getElementById('summaryToggle');
  const expandAllBtn = document.getElementById('expandAll');
  const progressBar = document.getElementById('progressBar');

  const SUMMARY_MATCHERS = [/executive summary/i, /conclusion/i, /recommendations?/i];
  let originalHTML = '';
  let headings = [];

  function updateProgress(){
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    progressBar.style.width = progress + '%';
  }

  function slugify(text){
    return text.toLowerCase().replace(/\*|\_|\`|\(|\)|\[|\]|\.|\:|\!|\?|'|"/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  }

  function buildTOC(){
    tocEl.innerHTML = '';
    headings = Array.from(contentEl.querySelectorAll('h1, h2, h3, h4'));
    headings.forEach(h => {
      if(!h.id){ h.id = slugify(h.textContent.trim()); }
      const level = Number(h.tagName.substring(1));
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/\*/g,'').trim();
      a.className = 'lvl-' + level;
      tocEl.appendChild(a);
    });

    const observer = new IntersectionObserver((entries)=>{
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio - a.intersectionRatio)[0];
      if(!visible) return;
      const id = visible.target.id;
      Array.from(tocEl.querySelectorAll('a')).forEach(a=>a.classList.toggle('active', a.hash === '#' + id));
    },{ rootMargin: '0px 0px -70% 0px', threshold:[0,0.25,0.5,1] });
    headings.forEach(h=>observer.observe(h));
  }

  function renderMarkdown(md){
    const raw = marked.parse(md, { mangle:false, headerIds:false });
    const safe = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    contentEl.innerHTML = safe;
    originalHTML = safe;
    buildTOC();
  }

  async function load(){
    try{
      const res = await fetch('./report.md', { cache: 'no-store' });
      const text = await res.text();
      renderMarkdown(text);
      restoreUIState();
    }catch(err){
      contentEl.innerHTML = '<p style="color:#f88">Failed to load report.md</p>';
      console.error(err);
    }
  }

  function clearHighlights(){
    contentEl.innerHTML = originalHTML;
    buildTOC();
  }

  function highlightTerm(term){
    if(!term){ clearHighlights(); return; }
    clearHighlights();
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null);
    const ranges = [];
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
    let node;
    while((node = walker.nextNode())){
      const text = node.nodeValue;
      let match;
      while((match = rx.exec(text))){
        const r = document.createRange();
        r.setStart(node, match.index);
        r.setEnd(node, match.index + match[0].length);
        ranges.push(r);
      }
    }
    ranges.forEach(r=>{
      const mark = document.createElement('mark');
      r.surroundContents(mark);
    });
  }

  function filterSummary(onlySummary){
    if(!onlySummary){
      contentEl.innerHTML = originalHTML;
      buildTOC();
      return;
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = originalHTML;
    const hs = Array.from(tmp.querySelectorAll('h1, h2, h3, h4'));
    const keepIds = new Set();
    hs.forEach((h,i)=>{
      const text = h.textContent || '';
      if(SUMMARY_MATCHERS.some(rx=>rx.test(text))){
        keepIds.add(h.id || slugify(text.trim()));
        // also keep following siblings until next same-level heading
        let el = h.nextElementSibling;
        while(el && !(el.tagName && /^H[1-4]$/.test(el.tagName))){
          el.dataset.keep = '1';
          el = el.nextElementSibling;
        }
      }
    });
    // remove nodes that are not summary sections
    Array.from(tmp.children).forEach(ch=>{
      // leave top-level non-heading nodes if part of kept sections
      if(/^H[1-4]$/.test(ch.tagName)){
        const id = ch.id || slugify(ch.textContent.trim());
        if(!keepIds.has(id)){
          ch.remove();
          let el = ch?.nextElementSibling;
          while(el && !(el.tagName && /^H[1-4]$/.test(el.tagName))){
            const next = el.nextElementSibling;
            el.remove();
            el = next;
          }
        }
      }
    });
    contentEl.innerHTML = tmp.innerHTML;
    buildTOC();
  }

  function navigateHeading(direction){
    if(!headings.length) return;
    const scrollY = window.scrollY;
    const currentIndex = headings.findIndex(h=>h.getBoundingClientRect().top + window.scrollY - 80 > scrollY);
    let target;
    if(direction === 'next'){
      target = headings[Math.min((currentIndex === -1 ? 0 : currentIndex), headings.length - 1)];
    }else{
      target = headings[Math.max(0, (currentIndex - 1))];
    }
    if(target) target.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function saveUIState(){
    try{
      localStorage.setItem('summaryOnly', summaryToggle.checked ? '1' : '0');
    }catch(_){ /* ignore */ }
  }
  function restoreUIState(){
    try{
      const v = localStorage.getItem('summaryOnly');
      if(v === '1'){ summaryToggle.checked = true; filterSummary(true); }
    }catch(_){ /* ignore */ }
  }

  // Events
  document.addEventListener('scroll', updateProgress, { passive:true });
  updateProgress();

  searchEl.addEventListener('input', (e)=>{
    const term = e.target.value.trim();
    highlightTerm(term);
  });
  clearBtn.addEventListener('click', ()=>{
    searchEl.value = '';
    clearHighlights();
    searchEl.focus();
  });
  summaryToggle.addEventListener('change', ()=>{ filterSummary(summaryToggle.checked); saveUIState(); });
  expandAllBtn.addEventListener('click', ()=>{
    summaryToggle.checked = false; filterSummary(false); searchEl.value=''; clearHighlights();
  });

  document.addEventListener('keydown', (e)=>{
    const modK = (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey));
    if(modK || e.key === '/'){
      e.preventDefault(); searchEl.focus(); searchEl.select(); return;
    }
    if(e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey){
      e.preventDefault(); summaryToggle.checked = !summaryToggle.checked; summaryToggle.dispatchEvent(new Event('change')); return;
    }
    if(e.key === ']'){ e.preventDefault(); navigateHeading('next'); return; }
    if(e.key === '['){ e.preventDefault(); navigateHeading('prev'); return; }
  });

  // Load
  load();
})();


