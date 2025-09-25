function selectTab(tabId) {
  document.querySelectorAll('.tab').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`);
  });
}

function setTheme(theme) {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  localStorage.setItem('theme', theme);
}

function estimateReadingTime(wordsCount) {
  const wordsPerMinute = 220;
  return Math.max(1, Math.round(wordsCount / wordsPerMinute));
}

function sanitizeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
}

function preprocessReport(raw) {
  let t = raw.trim();
  t = t.replace(/(Executive Summary:)/g, '\n$1\n');
  t = t.replace(/(Part\s+[IVX]+:)/g, '\n$1\n');
  t = t.replace(/(Chapter\s+\d+:)/g, '\n$1\n');
  t = t.replace(/(Case Study:)/g, '\n$1 ');
  t = t.replace(/(The following table)/g, '\n$1');
  t = t.replace(/(Framework\/Model)/g, '\n$1');
  return t;
}

function extractSections(text) {
  const lines = text.split(/\n+/);
  const sections = [];
  let current = { title: 'Executive Summary', content: [] };
  for (const line of lines) {
    if (/^Part\s+[IVX]+:/.test(line)) {
      if (current.content.length) sections.push(current);
      current = { title: line.trim(), content: [] };
    } else if (/^Chapter\s+\d+:/.test(line)) {
      if (current.content.length) sections.push(current);
      current = { title: line.trim(), content: [] };
    } else if (/^Executive Summary:/.test(line)) {
      if (current.content.length) sections.push(current);
      current = { title: 'Executive Summary', content: [] };
    } else {
      current.content.push(line.trim());
    }
  }
  if (current.content.length) sections.push(current);
  sections.forEach(s => s.text = s.content.join('\n').trim());
  return sections;
}

function generateOverview(text) {
  const sentences = splitIntoSentences(text);
  const first = sentences.slice(0, 2).join(' ');
  const keySentences = sentences.filter(s => /(benefit|value|trust|engag|memorable|system|practical|results|limitations|not intended|pricey)/i.test(s)).slice(0, 6);
  return { intro: first, bullets: keySentences };
}

function extractTactics(text) {
  const known = [
    'Man in a Hole', 'Data Detectives', 'Hero & Guide', 'Rags to Riches',
    'Simple Sales Stories', 'Pitch Perfect', 'Emotional Dashboard',
    "Trust Me, I'm an Expert", 'The Dragon & the City', 'Order & Chaos',
    'Pride & Fall', 'Epic Fail'
  ];
  const found = [];
  for (const name of known) {
    const re = new RegExp(name.replace(/[-/\\^$*+?.()|[\]{}]/g, r => `\\${r}`), 'i');
    if (re.test(text)) found.push(name);
  }
  return [...new Set(found)].sort();
}

function extractCaseStudies(text) {
  const blocks = text.split(/Case Study:/g).slice(1);
  return blocks.map(b => 'Case Study:' + b.trim()).slice(0, 10);
}

function extractComparison(text) {
  const has = {
    storyteller: /Storyteller Tactics/i.test(text),
    storybrand: /StoryBrand/i.test(text),
    heros: /Hero's Journey|Joseph Campbell/i.test(text)
  };
  return has;
}

function buildTOC(sections) {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  const tabs = [
    ['Overview', 'overview'],
    ['Sections', 'sections'],
    ['Tactics', 'tactics'],
    ['Case Studies', 'cases'],
    ['Compare', 'compare'],
    ['Full Text', 'full']
  ];
  for (const [label, id] of tabs) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', e => { e.preventDefault(); selectTab(id); });
    toc.appendChild(a);
  }
  const list = document.createElement('div');
  list.className = 'small muted';
  list.innerHTML = '<div style="margin-top:.75rem;font-weight:600">Report Sections</div>';
  sections.forEach((s, i) => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = `${i + 1}. ${s.title}`;
    a.addEventListener('click', e => {
      e.preventDefault();
      selectTab('sections');
      const el = document.querySelector(`[data-section-index="${i}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    list.appendChild(a);
  });
  toc.appendChild(list);
}

function renderOverview(overview) {
  const el = document.getElementById('overview');
  el.innerHTML = '';
  const intro = document.createElement('div');
  intro.className = 'card';
  intro.innerHTML = `<strong>Executive Summary</strong><p>${sanitizeHtml(overview.intro)}</p>`;
  el.appendChild(intro);

  if (overview.bullets.length) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<strong>Key Points</strong>';
    const ul = document.createElement('ul');
    ul.className = 'inline';
    overview.bullets.forEach(b => {
      const li = document.createElement('li');
      li.textContent = b.trim();
      ul.appendChild(li);
    });
    card.appendChild(ul);
    el.appendChild(card);
  }
}

function renderSections(sections) {
  const el = document.getElementById('sections');
  el.innerHTML = '';
  sections.forEach((s, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-section-index', String(i));
    const btn = document.createElement('button');
    btn.className = 'collapsible';
    btn.textContent = s.title;
    btn.setAttribute('aria-expanded', 'false');
    const content = document.createElement('div');
    content.className = 'collapse-content';
    const p = document.createElement('p');
    p.textContent = s.text;
    content.appendChild(p);
    btn.addEventListener('click', () => {
      const opened = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!opened));
    });
    wrapper.appendChild(btn);
    wrapper.appendChild(content);
    el.appendChild(wrapper);
  });
}

function renderTactics(tactics) {
  const el = document.getElementById('tactics');
  el.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  if (tactics.length === 0) {
    card.textContent = 'No tactics detected.';
  } else {
    const ul = document.createElement('ul');
    ul.className = 'inline';
    tactics.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    card.innerHTML = '<strong>Tactics Mentioned</strong>';
    card.appendChild(ul);
  }
  el.appendChild(card);
}

function renderCases(cases) {
  const el = document.getElementById('cases');
  el.innerHTML = '';
  if (cases.length === 0) {
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = 'No case studies detected.';
    el.appendChild(card);
    return;
  }
  cases.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = c;
    el.appendChild(card);
  });
}

function renderComparison(flags) {
  const el = document.getElementById('compare');
  el.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = `
    <thead><tr><th>Framework/Model</th><th>Detected in Report</th></tr></thead>
    <tbody>
      <tr><td>Storyteller Tactics</td><td>${flags.storyteller ? 'Yes' : 'No'}</td></tr>
      <tr><td>StoryBrand (Donald Miller)</td><td>${flags.storybrand ? 'Yes' : 'No'}</td></tr>
      <tr><td>Hero's Journey (Joseph Campbell)</td><td>${flags.heros ? 'Yes' : 'No'}</td></tr>
    </tbody>
  `;
  el.appendChild(table);
}

function renderFullText(text) {
  const el = document.getElementById('full');
  el.textContent = text;
}

function highlightAll(query) {
  const panels = ['overview','sections','tactics','cases','compare','full'];
  panels.forEach(id => {
    const panel = document.getElementById(id === 'full' ? 'full' : id);
    if (!panel) return;
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT, null);
    const ranges = [];
    let node;
    const q = query.trim();
    while ((node = walker.nextNode())) {
      const idx = q ? node.nodeValue.toLowerCase().indexOf(q.toLowerCase()) : -1;
      if (idx >= 0 && node.nodeValue.trim()) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + q.length);
        ranges.push(range);
      }
    }
    document.querySelectorAll('mark').forEach(m => m.replaceWith(...m.childNodes));
    ranges.forEach(r => {
      const mark = document.createElement('mark');
      r.surroundContents(mark);
    });
  });
}

async function init() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  });
  document.getElementById('toggleTheme').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  });
  const search = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  search.addEventListener('input', () => highlightAll(search.value));
  clearBtn.addEventListener('click', () => { search.value = ''; highlightAll(''); search.focus(); });

  const res = await fetch('report.txt');
  const raw = await res.text();
  const report = preprocessReport(raw);

  const words = report.trim().split(/\s+/).length;
  const meta = document.getElementById('meta');
  meta.innerHTML = `<div><strong>Words:</strong> ${words.toLocaleString()}</div><div><strong>Est. reading:</strong> ${estimateReadingTime(words)} min</div>`;

  const sections = extractSections(report);
  buildTOC(sections);
  renderOverview(generateOverview(report));
  renderSections(sections);
  renderTactics(extractTactics(report));
  renderCases(extractCaseStudies(report));
  renderComparison(extractComparison(report));
  renderFullText(report);
}

document.addEventListener('DOMContentLoaded', init);


