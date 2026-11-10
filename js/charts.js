// Visualization Module: Innovation Atlas 2026/2027
// Interactive SVG MiniCharts matching the Regional World Map aesthetic.
// Features cartographic canvas gradients, dashed latitude/longitude rules,
// shadow-cast circular map pins, coin-stack metaphors, and a 23x6 (138-tile) unit waffle grid.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'));
  } else {
    root.DirectoryCharts = factory(root.DirectoryEngine);
  }
}(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function svgHeaderDefs(suffix) {
    return `
      <defs>
        <radialGradient id="chartOcean-${suffix}" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f1f5f9" />
        </radialGradient>
        <filter id="chartShadow-${suffix}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.22" />
        </filter>
      </defs>
      <rect x="0.5" y="0.5" width="359" height="214" rx="12" fill="url(#chartOcean-${suffix})" stroke="#e2e8f0" stroke-width="1" />
    `;
  }

  /**
   * CHART 1: Regional Footprint — Map-Matched Packed Pin Constellation
   * Radius scaled proportional to square root of count (area-accurate)
   */
  function renderRegionPinChart(dataset) {
    const regionCounts = {
      Africa: 0,
      Global: 0,
      Europe: 0,
      Americas: 0,
      Asia: 0,
      'Middle East': 0,
      Oceania: 0
    };

    dataset.forEach(item => {
      (item.region_tags || []).forEach(r => {
        if (Object.prototype.hasOwnProperty.call(regionCounts, r)) {
          regionCounts[r]++;
        }
      });
    });

    const total = dataset.length || 138;
    const maxCount = Math.max(1, ...Object.values(regionCounts));

    const nodes = [
      { key: 'Africa', label: 'AFRICA', fill: '#2563eb', dark: '#1d4ed8', cx: 82, cy: 66, labelY: 112 },
      { key: 'Global', label: 'GLOBAL', fill: '#1e293b', dark: '#0f172a', cx: 196, cy: 66, labelY: 112 },
      { key: 'Europe', label: 'EUROPE', fill: '#0d9488', dark: '#0f766e', cx: 294, cy: 66, labelY: 112 },
      { key: 'Americas', label: 'AMERICAS', fill: '#4f46e5', dark: '#4338ca', cx: 56, cy: 152, labelY: 186 },
      { key: 'Asia', label: 'ASIA', fill: '#0284c7', dark: '#0369a1', cx: 140, cy: 152, labelY: 186 },
      { key: 'Middle East', label: 'MID EAST', fill: '#d97706', dark: '#b45309', cx: 226, cy: 152, labelY: 186 },
      { key: 'Oceania', label: 'OCEANIA', fill: '#059669', dark: '#047857', cx: 306, cy: 152, labelY: 186 }
    ];

    let pinsMarkup = '';
    nodes.forEach(n => {
      const count = regionCounts[n.key] || 0;
      const pct = Math.round((count / total) * 100);
      const r = Math.max(10, Math.round(Math.sqrt(count / maxCount) * 31));
      const haloR = r + 7;
      const fontSize = r >= 24 ? 13 : r >= 15 ? 11 : 9.5;
      const pillLabel = pct >= 5 ? `${n.label} ${pct}%` : n.label;
      const pillW = Math.max(54, pillLabel.length * 5.8 + 16);
      const pillX = Math.max(8, Math.min(352 - pillW, n.cx - pillW / 2));

      pinsMarkup += `
        <g 
          class="chart-node cursor-pointer" 
          data-chart-action="region" 
          data-chart-value="${esc(n.key)}"
          data-tooltip="${esc(n.key)}: ${count} opportunities (${pct}% of directory) • Click to filter"
        >
          <circle cx="${n.cx}" cy="${n.cy}" r="${haloR}" fill="${n.fill}" opacity="0.16" />
          <circle cx="${n.cx}" cy="${n.cy}" r="${r + 2.5}" fill="${n.dark}" filter="url(#chartShadow-reg)" />
          <circle cx="${n.cx}" cy="${n.cy}" r="${r}" fill="${n.fill}" stroke="#ffffff" stroke-width="2" />
          <text x="${n.cx}" y="${n.cy + fontSize * 0.36}" text-anchor="middle" fill="#ffffff" font-size="${fontSize}" font-weight="800" font-family="'JetBrains Mono', monospace">${count}</text>
          <rect x="${pillX}" y="${n.labelY - 10}" width="${pillW}" height="17" rx="8.5" fill="#0f172a" />
          <text x="${pillX + pillW / 2}" y="${n.labelY + 1.5}" text-anchor="middle" fill="#f8fafc" font-size="8.2" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${esc(pillLabel)}</text>
        </g>
      `;
    });

    return `
      <svg viewBox="0 0 360 215" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Regional opportunity distribution bubble pin chart">
        ${svgHeaderDefs('reg')}
        <g stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="4 5">
          <line x1="20" y1="66" x2="340" y2="66" />
          <line x1="20" y1="152" x2="340" y2="152" />
          <line x1="120" y1="16" x2="120" y2="198" />
          <line x1="240" y1="16" x2="240" y2="198" />
        </g>
        ${pinsMarkup}
      </svg>
    `;
  }

  /**
   * CHART 2: Headline Capital Pools — Stacked Coin Towers (MiniCharts Metaphor)
   * Displays top awards sized cleanly to approximate USD value scale.
   */
  function renderCapitalCoinChart() {
    const pools = [
      {
        short: 'EU Green',
        name: 'EU Green Assist Advisory',
        badge: '€3.0M',
        usdApprox: 3.25,
        coins: 15,
        searchKey: 'EU Green',
        fillTop: '#2dd4bf',
        fillSide: '#0d9488',
        fillRim: '#0f766e'
      },
      {
        short: 'EIC Tech',
        name: 'EIC Accelerator DeepTech',
        badge: '€2.5M',
        usdApprox: 2.70,
        coins: 13,
        searchKey: 'EIC',
        fillTop: '#38bdf8',
        fillSide: '#0284c7',
        fillRim: '#0369a1'
      },
      {
        short: 'ABH Prize',
        name: "Africa's Business Heroes",
        badge: '$1.5M',
        usdApprox: 1.50,
        coins: 8,
        searchKey: 'Business Heroes',
        fillTop: '#fbbf24',
        fillSide: '#d97706',
        fillRim: '#b45309'
      },
      {
        short: 'Flourish',
        name: 'Flourish Africa Grant',
        badge: '₦1.3B',
        usdApprox: 0.85,
        coins: 6,
        searchKey: 'Flourish',
        fillTop: '#60a5fa',
        fillSide: '#2563eb',
        fillRim: '#1d4ed8'
      },
      {
        short: 'BOI x MTN',
        name: "BOI x MTN Y'ellopreneur",
        badge: '₦1.0B',
        usdApprox: 0.65,
        coins: 5,
        searchKey: "Y'ellopreneur",
        fillTop: '#818cf8',
        fillSide: '#4f46e5',
        fillRim: '#4338ca'
      }
    ];

    const baseFloorY = 168;
    const coinStep = 7.4;
    const xs = [72, 134, 196, 258, 320];

    let stacksMarkup = '';
    pools.forEach((p, idx) => {
      const cx = xs[idx];
      let discs = `<ellipse cx="${cx}" cy="${baseFloorY + 3}" rx="20" ry="5" fill="#cbd5e1" opacity="0.55" />`;

      for (let c = 0; c < p.coins; c++) {
        const y = baseFloorY - c * coinStep;
        discs += `
          <path d="M ${cx - 18} ${y} v 5 a 18 4.8 0 0 0 36 0 v -5 z" fill="${p.fillRim}" />
          <ellipse cx="${cx}" cy="${y}" rx="18" ry="4.8" fill="${c === p.coins - 1 ? p.fillTop : p.fillSide}" stroke="#ffffff" stroke-width="0.9" />
        `;
      }

      const topY = baseFloorY - (p.coins - 1) * coinStep;
      const badgeW = 46;
      stacksMarkup += `
        <g 
          class="chart-node cursor-pointer" 
          data-chart-action="search" 
          data-chart-value="${esc(p.searchKey)}"
          data-tooltip="${esc(p.name)}: ${esc(p.badge)} (~$${p.usdApprox.toFixed(1)}M USD equiv.) • Click to view"
        >
          ${discs}
          <rect x="${cx - badgeW / 2}" y="${topY - 26}" width="${badgeW}" height="17" rx="8.5" fill="#0f172a" filter="url(#chartShadow-coin)" />
          <text x="${cx}" y="${topY - 14.5}" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="800" font-family="'JetBrains Mono', monospace">${esc(p.badge)}</text>
          <text x="${cx}" y="191" text-anchor="middle" fill="#334155" font-size="9.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${esc(p.short)}</text>
        </g>
      `;
    });

    return `
      <svg viewBox="0 0 360 215" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Headline grant and prize pool coin stack chart">
        ${svgHeaderDefs('coin')}
        <g stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="4 5">
          <line x1="42" y1="54" x2="346" y2="54" />
          <line x1="42" y1="92" x2="346" y2="92" />
          <line x1="42" y1="130" x2="346" y2="130" />
          <line x1="42" y1="168" x2="346" y2="168" stroke="#cbd5e1" stroke-dasharray="none" />
        </g>
        <g fill="#94a3b8" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="600">
          <text x="12" y="57">~$3M</text>
          <text x="12" y="95">~$2M</text>
          <text x="12" y="133">~$1M</text>
          <text x="20" y="171">$0</text>
        </g>
        ${stacksMarkup}
      </svg>
    `;
  }

  /**
   * CHART 3: Live Deadline Pipeline — 23x6 (138-Tile) Unit Waffle Matrix
   * Each single square represents 1 real opportunity evaluated live against today's date.
   */
  function renderDeadlineWaffleChart(dataset, referenceDate) {
    const groups = {
      urgent: { label: 'Urgent', color: '#e11d48', items: [], filterAction: 'active-only', tooltipPrefix: 'Closes Urgent' },
      open: { label: 'Open Dated', color: '#2563eb', items: [], filterAction: 'deadline-Specific date', tooltipPrefix: 'Upcoming Date' },
      rolling: { label: 'Rolling', color: '#059669', items: [], filterAction: 'deadline-Rolling', tooltipPrefix: 'Rolling / Continuous' },
      cohort: { label: 'Cohort / TBD', color: '#64748b', items: [], filterAction: 'deadline-Cohort', tooltipPrefix: 'Cohort / Portal / Recurring' },
      passed: { label: 'Passed Date', color: '#f59e0b', items: [], filterAction: 'all', tooltipPrefix: 'Listed Deadline Passed' }
    };

    dataset.forEach(item => {
      const status = Engine.getDeadlineStatus(item, referenceDate);
      const entry = { item, status };
      if (status.type === 'today' || status.type === 'tomorrow' || status.type === 'closing-soon') {
        groups.urgent.items.push(entry);
      } else if (status.type === 'open' || status.type === 'open-soon') {
        groups.open.items.push(entry);
      } else if (status.type === 'rolling') {
        groups.rolling.items.push(entry);
      } else if (status.isPast) {
        groups.passed.items.push(entry);
      } else {
        groups.cohort.items.push(entry);
      }
    });

    const orderedTiles = [];
    ['urgent', 'open', 'rolling', 'cohort', 'passed'].forEach(gKey => {
      groups[gKey].items.forEach(entry => {
        orderedTiles.push({
          gKey,
          color: groups[gKey].color,
          opacity: gKey === 'passed' ? 0.72 : 0.95,
          item: entry.item,
          status: entry.status
        });
      });
    });

    // 23 cols x 6 rows = 138 slots
    const cols = 23;
    const cellW = 11.2;
    const step = 13.6;
    const startX = 25;
    const startY = 24;

    let tilesMarkup = '';
    orderedTiles.forEach((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = (startX + col * step).toFixed(1);
      const y = (startY + row * step).toFixed(1);
      const tt = `#${t.item.id} ${t.item.opportunity_name} — ${t.status.badgeText} (Click to inspect)`;

      tilesMarkup += `
        <rect 
          x="${x}" y="${y}" width="${cellW}" height="${cellW}" rx="2.5" 
          fill="${t.color}" opacity="${t.opacity}"
          class="waffle-tile cursor-pointer"
          data-chart-action="open-opp"
          data-chart-value="${t.item.id}"
          data-tooltip="${esc(tt)}"
        />
      `;
    });

    // Interactive bottom legend row
    const legendItems = [
      { key: 'urgent', label: 'Closing Soon', x: 24, y: 142, w: 94 },
      { key: 'open', label: 'Upcoming', x: 126, y: 142, w: 94 },
      { key: 'rolling', label: 'Rolling', x: 228, y: 142, w: 106 },
      { key: 'cohort', label: 'Cohort/Portal', x: 64, y: 170, w: 112 },
      { key: 'passed', label: 'Past (Verify)', x: 186, y: 170, w: 112 }
    ];

    let legendMarkup = '';
    legendItems.forEach(lg => {
      const g = groups[lg.key];
      const count = g.items.length;
      legendMarkup += `
        <g 
          class="chart-node cursor-pointer" 
          data-chart-action="${esc(g.filterAction)}" 
          data-chart-value="${esc(lg.key)}"
          data-tooltip="${esc(lg.label)}: ${count} of ${dataset.length} programs • Click to filter"
        >
          <rect x="${lg.x}" y="${lg.y}" width="${lg.w}" height="21" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
          <rect x="${lg.x + 6}" y="${lg.y + 6.5}" width="8" height="8" rx="2" fill="${g.color}" opacity="${lg.key === 'passed' ? 0.72 : 1}" />
          <text x="${lg.x + 18}" y="${lg.y + 13.5}" fill="#334155" font-size="8.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${lg.label}</text>
          <text x="${lg.x + lg.w - 6}" y="${lg.y + 13.5}" text-anchor="end" fill="#0f172a" font-size="8.5" font-weight="800" font-family="'JetBrains Mono', monospace">${count}</text>
        </g>
      `;
    });

    return {
      svg: `
        <svg viewBox="0 0 360 205" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="138 opportunity live deadline status waffle chart">
          <defs>
            <radialGradient id="chartOcean-waf" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#f1f5f9" />
            </radialGradient>
          </defs>
          <rect x="0.5" y="0.5" width="359" height="204" rx="12" fill="url(#chartOcean-waf)" stroke="#e2e8f0" stroke-width="1" />
          <text x="25" y="16.5" fill="#64748b" font-size="8.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">1 SQUARE = 1 PROGRAM (23 × 6 GRID = ${orderedTiles.length} LIVE)</text>
          ${tilesMarkup}
          ${legendMarkup}
        </svg>
      `,
      counts: {
        urgent: groups.urgent.items.length,
        open: groups.open.items.length,
        rolling: groups.rolling.items.length,
        cohort: groups.cohort.items.length,
        passed: groups.passed.items.length,
        activeTotal: groups.urgent.items.length + groups.open.items.length + groups.rolling.items.length
      }
    };
  }

  /**
   * CHART 4: Program Categories — Map-Pin Horizontal Lollipop Matrix
   */
  function renderCategoryLollipopChart(dataset) {
    const counts = {};
    dataset.forEach(item => {
      (item.categories || []).forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });

    const colors = {
      Grants: '#0d9488',
      Training: '#0284c7',
      Accelerators: '#2563eb',
      Competitions: '#4f46e5',
      Scholarships: '#7c3aed',
      Mentorship: '#059669',
      'Business Support': '#d97706',
      Fellowships: '#1e293b'
    };

    const sorted = Object.entries(counts)
      .filter(([name]) => name !== 'Other')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const maxVal = Math.max(1, sorted[0] ? sorted[0][1] : 65);
    const total = dataset.length || 138;
    const xStart = 114;
    const maxLen = 212; // 114 .. 326

    let rowsMarkup = '';
    sorted.forEach(([cat, count], idx) => {
      const y = 26 + idx * 21.5;
      const barEnd = xStart + Math.max(16, (count / maxVal) * maxLen);
      const col = colors[cat] || '#2563eb';
      const pct = Math.round((count / total) * 100);
      const shortLabel = cat === 'Business Support' ? 'Biz Support' : cat;

      rowsMarkup += `
        <g 
          class="chart-node cursor-pointer" 
          data-chart-action="category" 
          data-chart-value="${esc(cat)}"
          data-tooltip="${esc(cat)}: ${count} programs (${pct}% of directory) • Click to filter"
        >
          <rect x="8" y="${y - 9.5}" width="344" height="19" rx="5" fill="transparent" />
          <text x="106" y="${y + 3}" text-anchor="end" fill="#334155" font-size="9.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${esc(shortLabel)}</text>
          <line x1="${xStart}" y1="${y}" x2="338" y2="${y}" stroke="#e2e8f0" stroke-width="3.5" stroke-linecap="round" />
          <line x1="${xStart}" y1="${y}" x2="${barEnd}" y2="${y}" stroke="${col}" stroke-width="4" stroke-linecap="round" />
          <circle cx="${barEnd}" cy="${y}" r="8.5" fill="${col}" stroke="#ffffff" stroke-width="1.8" filter="url(#chartShadow-cat)" />
          <text x="${barEnd}" y="${y + 3}" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="800" font-family="'JetBrains Mono', monospace">${count}</text>
        </g>
      `;
    });

    const scaleTicks = [0, 20, 40, 60];
    let gridMarkup = '';
    scaleTicks.forEach(val => {
      if (val > maxVal + 5) return;
      const gx = xStart + (val / maxVal) * maxLen;
      gridMarkup += `
        <line x1="${gx}" y1="14" x2="${gx}" y2="192" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="3 4" />
        <text x="${gx}" y="205" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="'JetBrains Mono', monospace">${val}</text>
      `;
    });

    return `
      <svg viewBox="0 0 360 215" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Program category lollipop chart">
        ${svgHeaderDefs('cat')}
        ${gridMarkup}
        ${rowsMarkup}
      </svg>
    `;
  }

  /**
   * CHART 5: Target Audiences — Map-Badge Segmented Track Chart
   */
  function renderDemographicPinChart(dataset) {
    const counts = {};
    dataset.forEach(item => {
      (item.eligibility_tags || []).forEach(e => {
        counts[e] = (counts[e] || 0) + 1;
      });
    });

    const labelMap = {
      Startups: 'Startups',
      Entrepreneurs: 'Entrepreneurs',
      Women: 'Women in Tech',
      'SMEs/business owners': 'SMEs / Owners',
      'Young professionals': 'Young Pros',
      Graduates: 'Graduates',
      Researchers: 'Researchers',
      Students: 'Students',
      NGOs: 'NGOs / Civic'
    };

    const colorMap = {
      Startups: '#2563eb',
      Entrepreneurs: '#0284c7',
      Women: '#7c3aed',
      'SMEs/business owners': '#0d9488',
      'Young professionals': '#4f46e5',
      Graduates: '#059669',
      Researchers: '#d97706',
      Students: '#3b82f6'
    };

    const sorted = Object.entries(counts)
      .filter(([name]) => name !== 'Other')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const maxVal = Math.max(1, sorted[0] ? sorted[0][1] : 43);
    const total = dataset.length || 138;
    const xStart = 108;
    const maxLen = 200; // leaves room on right for count pill

    let rowsMarkup = '';
    sorted.forEach(([tag, count], idx) => {
      const y = 26 + idx * 21.5;
      const width = Math.max(14, (count / maxVal) * maxLen);
      const col = colorMap[tag] || '#2563eb';
      const pct = Math.round((count / total) * 100);
      const displayLabel = labelMap[tag] || tag;
      const pillX = xStart + width + 6;

      rowsMarkup += `
        <g 
          class="chart-node cursor-pointer" 
          data-chart-action="eligibility" 
          data-chart-value="${esc(tag)}"
          data-tooltip="${esc(displayLabel)}: ${count} programs (${pct}% match) • Click to filter"
        >
          <text x="100" y="${y + 3}" text-anchor="end" fill="#334155" font-size="9.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">${esc(displayLabel)}</text>
          <rect x="${xStart}" y="${y - 5.5}" width="${maxLen}" height="11" rx="5.5" fill="#e2e8f0" opacity="0.65" />
          <rect x="${xStart}" y="${y - 5.5}" width="${width}" height="11" rx="5.5" fill="${col}" />
          <circle cx="${xStart + width - 5.5}" cy="${y}" r="3" fill="#ffffff" opacity="0.85" />
          <rect x="${pillX}" y="${y - 7.5}" width="26" height="15" rx="7.5" fill="#0f172a" />
          <text x="${pillX + 13}" y="${y + 3}" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="800" font-family="'JetBrains Mono', monospace">${count}</text>
        </g>
      `;
    });

    const ticks = [0, 15, 30, 45];
    let gridMarkup = '';
    ticks.forEach(val => {
      if (val > maxVal + 6) return;
      const gx = xStart + (val / maxVal) * maxLen;
      gridMarkup += `
        <line x1="${gx}" y1="14" x2="${gx}" y2="192" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="3 4" />
        <text x="${gx}" y="205" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="'JetBrains Mono', monospace">${val}</text>
      `;
    });

    return `
      <svg viewBox="0 0 360 215" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Target audience eligibility horizontal bar chart">
        ${svgHeaderDefs('dem')}
        ${gridMarkup}
        ${rowsMarkup}
      </svg>
    `;
  }

  /**
   * CHART 6: Shortlist & Dossier Readiness — Concentric Orbital Ring Gauge
   */
  function renderReadinessRingChart(dataset, savedIds, checklistState) {
    const totalCount = dataset.length || 138;
    const savedCount = savedIds ? savedIds.size : 0;

    let checkedItemsCount = 0;
    let totalStartedDocs = 0;
    let startedOpportunitiesCount = 0;

    if (checklistState) {
      dataset.forEach(item => {
        const docs = item.required_documents_list || [];
        const savedMap = checklistState[item.id];
        if (savedMap) {
          const checkedHere = docs.filter(d => savedMap[d]).length;
          if (checkedHere > 0) {
            startedOpportunitiesCount++;
            checkedItemsCount += checkedHere;
            totalStartedDocs += docs.length;
          }
        }
      });
    }

    const rOuter = 44;
    const cOuter = 2 * Math.PI * rOuter;
    const savedRatio = totalCount > 0 ? Math.min(1, savedCount / totalCount) : 0;
    const dashOuter = savedRatio === 0 ? 0 : Math.max(8, savedRatio * cOuter);

    const rInner = 31;
    const cInner = 2 * Math.PI * rInner;
    const docsRatio = totalStartedDocs > 0 ? Math.min(1, checkedItemsCount / totalStartedDocs) : 0;
    const dashInner = docsRatio === 0 ? 0 : Math.max(8, docsRatio * cInner);

    return `
      <svg viewBox="0 0 360 142" class="w-full h-auto select-none block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shortlist and checklist readiness radial gauge">
        <defs>
          <radialGradient id="chartOcean-ready" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f1f5f9" />
          </radialGradient>
        </defs>
        <rect x="0.5" y="0.5" width="359" height="141" rx="12" fill="url(#chartOcean-ready)" stroke="#e2e8f0" stroke-width="1" />

        <!-- Concentric Map Halo Rings -->
        <g transform="translate(76, 71)">
          <circle r="54" fill="#2563eb" opacity="0.06" />
          <circle r="${rOuter}" fill="none" stroke="#e2e8f0" stroke-width="8" />
          <circle r="${rOuter}" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${dashOuter.toFixed(1)} ${cOuter.toFixed(1)}"
            transform="rotate(-90)" />

          <circle r="${rInner}" fill="none" stroke="#e2e8f0" stroke-width="7" />
          <circle r="${rInner}" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"
            stroke-dasharray="${dashInner.toFixed(1)} ${cInner.toFixed(1)}"
            transform="rotate(-90)" />

          <text y="3" text-anchor="middle" fill="#0f172a" font-size="20" font-weight="800" font-family="'JetBrains Mono', monospace">${savedCount}</text>
          <text y="15" text-anchor="middle" fill="#64748b" font-size="7.5" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">SAVED</text>
        </g>

        <!-- Right Readout Metrics -->
        <g transform="translate(148, 28)">
          <g class="chart-node cursor-pointer" data-chart-action="saved" data-tooltip="Click to view your shortlisted opportunities">
            <rect x="0" y="0" width="194" height="38" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
            <circle cx="14" cy="19" r="5" fill="#f59e0b" />
            <text x="26" y="16" fill="#334155" font-size="10" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Bookmarked Shortlist</text>
            <text x="26" y="29" fill="#64748b" font-size="8.5" font-family="'Plus Jakarta Sans', sans-serif">${savedCount} of ${totalCount} programs starred</text>
          </g>

          <g transform="translate(0, 48)">
            <rect x="0" y="0" width="194" height="38" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
            <circle cx="14" cy="19" r="5" fill="#10b981" />
            <text x="26" y="16" fill="#334155" font-size="10" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Document Dossiers</text>
            <text x="26" y="29" fill="#64748b" font-size="8.5" font-family="'Plus Jakarta Sans', sans-serif">${checkedItemsCount} docs checked (${startedOpportunitiesCount} active)</text>
          </g>
        </g>
      </svg>
    `;
  }

  return {
    renderRegionPinChart,
    renderCapitalCoinChart,
    renderDeadlineWaffleChart,
    renderCategoryLollipopChart,
    renderDemographicPinChart,
    renderReadinessRingChart
  };
}));
