// UI Controller: Global Innovation Opportunities Directory 2026/2027
// Presentation layer, DOM manipulation, accessible interaction, modal drawer, checklists, and state syncing.

(function () {
  'use strict';

  // State Management
  let dataset = [];
  let currentFilteredList = [];
  let currentModalIndex = 0;

  const state = {
    search: '',
    regions: [],
    categories: [],
    deadlineTypes: [],
    eligibilityTags: [],
    onlySaved: false,
    onlyActiveDeadlines: false,
    sort: 'name-asc',
    page: 1,
    perPage: 6,
    viewMode: 'cards', // 'cards' | 'table'
    savedIds: new Set(JSON.parse(localStorage.getItem('god_saved_ids') || '[]')),
    checklistState: JSON.parse(localStorage.getItem('god_checklist_state') || '{}')
  };

  // DOM Elements Cache
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const toggleFilterBtn = document.getElementById('toggle-filter-btn');
  const filterDrawer = document.getElementById('filter-drawer');
  const activeFilterBadge = document.getElementById('active-filter-badge');
  const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
  const sortSelect = document.getElementById('sort-select');
  const toggleActiveDeadlines = document.getElementById('toggle-active-deadlines');
  const toggleSavedBtn = document.getElementById('toggle-saved-btn');
  const savedCounter = document.getElementById('saved-counter');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const viewCardsBtn = document.getElementById('view-cards-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  const resultsCards = document.getElementById('results-cards');
  const resultsTableContainer = document.getElementById('results-table-container');
  const resultsTableBody = document.getElementById('results-table-body');
  const noResultsState = document.getElementById('no-results-state');
  const resetEmptyBtn = document.getElementById('reset-empty-btn');
  const activeChipsContainer = document.getElementById('active-chips-container');
  const resultsCountText = document.getElementById('results-count-text');
  const perPageSelect = document.getElementById('per-page-select');
  const paginationBar = document.getElementById('pagination-bar');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationButtons = document.getElementById('pagination-buttons');

  // Modal Elements
  const modal = document.getElementById('opportunity-modal');
  const modalBackdrop = document.getElementById('opportunity-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalSn = document.getElementById('modal-sn');
  const modalRegion = document.getElementById('modal-region');
  const modalSourcePage = document.getElementById('modal-source-page');
  const modalOppName = document.getElementById('modal-opp-name');
  const modalBenefits = document.getElementById('modal-benefits');
  const modalEligibility = document.getElementById('modal-eligibility');
  const modalTagsContainer = document.getElementById('modal-tags-container');
  const modalChecklistContainer = document.getElementById('modal-checklist-container');
  const modalChecklistStatus = document.getElementById('modal-checklist-status');
  const modalDeadline = document.getElementById('modal-deadline');
  const modalDeadlineStatusBadge = document.getElementById('modal-deadline-status-badge');
  const modalQualityNotes = document.getElementById('modal-quality-notes');
  const modalQualityNotesBox = document.getElementById('modal-quality-notes-box');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalPositionIndicator = document.getElementById('modal-position-indicator');
  const modalCopyBtn = document.getElementById('modal-copy-btn');
  const modalApplyBtn = document.getElementById('modal-apply-btn');
  const modalStarBtn = document.getElementById('modal-star-btn');
  const modalStarIcon = document.getElementById('modal-star-icon');

  // Filter Checkbox Groups
  const regionFiltersList = document.getElementById('region-filters-list');
  const categoryFiltersList = document.getElementById('category-filters-list');
  const deadlineFiltersList = document.getElementById('deadline-filters-list');
  const eligibilityFiltersList = document.getElementById('eligibility-filters-list');

  /**
   * Initializes the Application
   */
  async function init() {
    // 1. Load Data
    if (window.MASTER_OPPORTUNITIES_DATA && window.MASTER_OPPORTUNITIES_DATA.length > 0) {
      dataset = window.MASTER_OPPORTUNITIES_DATA;
    } else {
      try {
        const resp = await fetch('data/opportunities.json');
        dataset = await resp.json();
      } catch (err) {
        console.error('Failed to load dataset:', err);
        showToast('Error loading opportunity records', 'error');
        return;
      }
    }

    // 2. Render Header KPIs
    renderHeaderKPIs();

    // 3. Deserialize URL State
    restoreStateFromURL();

    // 4. Render Dynamic Filter Controls
    buildFilterCheckboxLists();

    // 5. Attach Events
    attachEventListeners();

    // 6. Update Saved Counter
    updateSavedCounter();

    // 7. Initial Query Execution & Render
    refresh();
  }

  /**
   * Renders Header Statistics
   */
  function renderHeaderKPIs() {
    const stats = DirectoryEngine.computeDirectoryStats(dataset);
    const elTotal = document.getElementById('stat-total');
    if (elTotal) elTotal.textContent = stats.totalOpportunities;
    const elRegions = document.getElementById('stat-regions');
    if (elRegions) elRegions.textContent = stats.regionsCoveredCount;
    const elRolling = document.getElementById('stat-rolling');
    if (elRolling) elRolling.textContent = stats.rollingCount;
    const elDated = document.getElementById('stat-dated');
    if (elDated) elDated.textContent = stats.datedDeadlinesCount;

    const liveDateEl = document.getElementById('live-today-date');
    if (liveDateEl) {
      const todayFormatted = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
      liveDateEl.textContent = `Today: ${todayFormatted}`;
    }
  }

  /**
   * Builds the filter checkboxes dynamically with counts
   */
  function buildFilterCheckboxLists() {
    const regionOptions = ['Africa', 'Americas', 'Asia', 'Europe', 'Global', 'Middle East', 'Oceania'];
    const categoryOptions = [
      'Scholarships', 'Grants', 'Fellowships', 'Internships',
      'Accelerators', 'Incubators', 'Competitions', 'Training',
      'Mentorship', 'Business Support', 'Research', 'Other'
    ];
    const deadlineOptions = [
      'Specific date', 'Rolling', 'Continuous intake', 'Varies by cohort',
      'Check portal', 'Quarterly', 'Annual or recurring', 'Other/unspecified'
    ];
    const eligibilityOptions = [
      'Students', 'Graduates', 'Young professionals', 'Entrepreneurs',
      'Startups', 'Women', 'Researchers', 'NGOs', 'SMEs/business owners', 'Other'
    ];

    function createCheckboxHTML(name, val, list, currentArray) {
      const isChecked = currentArray.includes(val) ? 'checked' : '';
      return `
        <label class="flex items-center gap-2 cursor-pointer hover:text-blue-600 select-none py-0.5">
          <input type="checkbox" name="${name}" value="${val}" ${isChecked} class="rounded text-blue-600 border-slate-300 focus:ring-blue-500">
          <span>${val}</span>
        </label>
      `;
    }

    regionFiltersList.innerHTML = regionOptions.map(r => createCheckboxHTML('region', r, dataset, state.regions)).join('');
    categoryFiltersList.innerHTML = categoryOptions.map(c => createCheckboxHTML('category', c, dataset, state.categories)).join('');
    deadlineFiltersList.innerHTML = deadlineOptions.map(d => createCheckboxHTML('deadline', d, dataset, state.deadlineTypes)).join('');
    eligibilityFiltersList.innerHTML = eligibilityOptions.map(e => createCheckboxHTML('eligibility', e, dataset, state.eligibilityTags)).join('');
  }

  /**
   * Synchronizes UI controls with internal state
   */
  function syncUIWithState() {
    searchInput.value = state.search;
    searchClearBtn.classList.toggle('hidden', !state.search);
    sortSelect.value = state.sort;
    perPageSelect.value = state.perPage;
    toggleActiveDeadlines.checked = state.onlyActiveDeadlines;

    // View buttons
    if (state.viewMode === 'cards') {
      viewCardsBtn.className = 'p-1.5 rounded-md text-blue-700 bg-white shadow-xs transition-all';
      viewTableBtn.className = 'p-1.5 rounded-md text-slate-500 hover:text-slate-700 transition-all';
      resultsCards.classList.remove('hidden');
      resultsTableContainer.classList.add('hidden');
    } else {
      viewTableBtn.className = 'p-1.5 rounded-md text-blue-700 bg-white shadow-xs transition-all';
      viewCardsBtn.className = 'p-1.5 rounded-md text-slate-500 hover:text-slate-700 transition-all';
      resultsCards.classList.add('hidden');
      resultsTableContainer.classList.remove('hidden');
    }

    // Saved button
    if (state.onlySaved) {
      toggleSavedBtn.classList.add('border-amber-500', 'bg-amber-50', 'text-amber-900');
    } else {
      toggleSavedBtn.classList.remove('border-amber-500', 'bg-amber-50', 'text-amber-900');
    }

    // Checkboxes
    document.querySelectorAll('#region-filters-list input').forEach(cb => {
      cb.checked = state.regions.includes(cb.value);
    });
    document.querySelectorAll('#category-filters-list input').forEach(cb => {
      cb.checked = state.categories.includes(cb.value);
    });
    document.querySelectorAll('#deadline-filters-list input').forEach(cb => {
      cb.checked = state.deadlineTypes.includes(cb.value);
    });
    document.querySelectorAll('#eligibility-filters-list input').forEach(cb => {
      cb.checked = state.eligibilityTags.includes(cb.value);
    });

    // Map Pills & Markers Synchronization
    document.querySelectorAll('.map-pill').forEach(pill => {
      const reg = pill.getAttribute('data-map-region');
      if (reg === 'all') {
        pill.classList.toggle('active', state.regions.length === 0);
      } else {
        pill.classList.toggle('active', state.regions.includes(reg));
      }
    });

    document.querySelectorAll('.map-pin-group').forEach(pin => {
      const reg = pin.getAttribute('data-region');
      pin.classList.toggle('active', state.regions.includes(reg));
    });

    document.querySelectorAll('.continent-path').forEach(path => {
      const reg = path.getAttribute('data-region');
      path.classList.toggle('active', state.regions.includes(reg));
    });

    // Active filters badge
    let activeFilterCount = 0;
    if (state.search) activeFilterCount++;
    activeFilterCount += state.regions.length;
    activeFilterCount += state.categories.length;
    activeFilterCount += state.deadlineTypes.length;
    activeFilterCount += state.eligibilityTags.length;
    if (state.onlyActiveDeadlines) activeFilterCount++;
    if (state.onlySaved) activeFilterCount++;

    if (activeFilterCount > 0) {
      activeFilterBadge.textContent = activeFilterCount;
      activeFilterBadge.classList.remove('hidden');
    } else {
      activeFilterBadge.classList.add('hidden');
    }
  }

  /**
   * Executes engine search, filter, and sort, then updates DOM
   */
  function refresh() {
    syncUIWithState();

    const result = DirectoryEngine.filterAndSort(dataset, {
      search: state.search,
      regions: state.regions,
      categories: state.categories,
      deadlineTypes: state.deadlineTypes,
      eligibilityTags: state.eligibilityTags,
      onlySaved: state.onlySaved,
      savedIds: state.savedIds,
      onlyActiveDeadlines: state.onlyActiveDeadlines,
      sort: state.sort,
      page: state.page,
      perPage: state.perPage
    });

    currentFilteredList = result.allFiltered;
    state.page = result.currentPage;

    // Update results counter text
    resultsCountText.textContent = `Showing ${result.totalCount} of ${dataset.length} Opportunities`;

    // Render components
    renderActiveChips();
    
    if (result.totalCount === 0) {
      resultsCards.classList.add('hidden');
      resultsTableContainer.classList.add('hidden');
      noResultsState.classList.remove('hidden');
      paginationBar.classList.add('hidden');
    } else {
      noResultsState.classList.add('hidden');
      paginationBar.classList.remove('hidden');

      if (state.viewMode === 'cards') {
        renderCards(result.items);
      } else {
        renderTableRows(result.items);
      }

      renderPagination(result);
    }

    // Sync URL query parameters
    updateURLState();
  }

  /**
   * Highlights search terms in safe HTML
   */
  function highlight(text, query) {
    if (!text) return '';
    const safe = escapeHtml(text);
    if (!query) return safe;

    const tokens = DirectoryEngine.tokenize(query);
    if (tokens.length === 0) return safe;

    const pattern = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    return safe.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Helper to format deadline-status badge calculated from today's date
   */
  function getDeadlineBadge(item) {
    const status = DirectoryEngine.getDeadlineStatus(item);
    let iconSvg = '';

    if (status.icon === 'warning') {
      iconSvg = `<svg class="w-3 h-3 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>`;
    } else if (status.icon === 'clock-urgent') {
      iconSvg = `<svg class="w-3 h-3 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`;
    } else if (status.icon === 'clock') {
      iconSvg = `<svg class="w-3 h-3 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`;
    } else if (status.icon === 'calendar-check') {
      iconSvg = `<svg class="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`;
    } else if (status.icon === 'refresh') {
      iconSvg = `<svg class="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>`;
    } else if (status.icon === 'layers') {
      iconSvg = `<svg class="w-3 h-3 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>`;
    } else if (status.icon === 'calendar') {
      iconSvg = `<svg class="w-3 h-3 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>`;
    } else {
      iconSvg = `<svg class="w-3 h-3 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`;
    }

    return `<span class="badge ${status.badgeClass}" title="${escapeHtml(status.title)}" data-status="${status.type}">
      ${iconSvg}
      <span>${escapeHtml(status.badgeText)}</span>
    </span>`;
  }

  /**
   * Renders Card Grid View
   */
  function renderCards(items) {
    resultsCards.innerHTML = items.map((item) => {
      const isSaved = state.savedIds.has(item.id);
      const highlightedName = highlight(item.opportunity_name, state.search);
      const highlightedBenefits = highlight(item.key_benefits_and_rewards, state.search);
      const highlightedEligibility = highlight(item.eligibility_criteria, state.search);
      const deadlineBadge = getDeadlineBadge(item);

      return `
        <div class="opportunity-card group">
          <div>
            <!-- Card Top Bar -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-600">
                  #${item.id}
                </span>
                <span class="badge badge-blue">
                  ${escapeHtml(item.continent_or_region)}
                </span>
                <span class="badge badge-slate">
                  Page ${item.source_page}
                </span>
              </div>

              <!-- Star Button -->
              <button 
                onclick="window.toggleBookmark(${item.id});" 
                class="p-1 rounded-md text-slate-400 hover:text-amber-500 transition-colors"
                title="${isSaved ? 'Remove from Saved' : 'Save opportunity'}"
                aria-label="Bookmark"
              >
                <svg class="w-4 h-4 ${isSaved ? 'text-amber-500 fill-amber-400' : ''}" fill="${isSaved ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>

            <!-- Opportunity Name -->
            <h3 
              onclick="window.openModalById(${item.id})" 
              class="text-base font-bold text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors leading-snug mb-2"
            >
              ${highlightedName}
            </h3>

            <!-- Category Chips -->
            <div class="flex flex-wrap gap-1 mb-2.5">
              ${(item.categories || []).map(cat => `
                <span class="badge badge-teal">${escapeHtml(cat)}</span>
              `).join('')}
            </div>

            <!-- Reward Callout -->
            <div class="reward-callout">
              <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-0.5">
                <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key Benefits & Rewards
              </div>
              <div class="text-xs font-semibold text-slate-900 line-clamp-2">
                ${highlightedBenefits}
              </div>
            </div>

            <!-- Eligibility Preview -->
            <p class="eligibility-snippet mb-3">
              <strong class="text-slate-700">Eligibility:</strong> ${highlightedEligibility}
            </p>

            <!-- Required Documents Snippet -->
            <div class="text-[11px] text-slate-500 mb-3 flex items-start gap-1">
              <strong class="text-slate-600 shrink-0">Docs:</strong>
              <span class="truncate" title="${escapeHtml(item.required_documents)}">${escapeHtml(item.required_documents)}</span>
            </div>

          </div>

          <!-- Card Footer -->
          <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
            
            <!-- Deadline Status Badge & Information -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-1 flex-wrap">
                ${deadlineBadge}
                ${item.deadline_date ? `<span class="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Normalized ISO deadline date">${escapeHtml(item.deadline_date)}</span>` : ''}
              </div>
              <div class="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="truncate" title="${escapeHtml(item.application_deadline)}"><span class="text-slate-500 font-medium">Deadline:</span> <strong class="text-slate-700">${escapeHtml(item.application_deadline)}</strong></span>
              </div>
            </div>

            <!-- Actions Row -->
            <div class="flex items-center justify-between gap-2 mt-1">
              <button 
                onclick="window.openModalById(${item.id})" 
                class="btn btn-secondary btn-sm"
              >
                View Details
              </button>

              <div class="flex items-center gap-1.5">
                <button 
                  onclick="window.copyOpportunityLink('${item.application_url}')" 
                  class="btn btn-secondary btn-sm text-slate-500 hover:text-slate-700 p-1.5"
                  title="Copy URL"
                  aria-label="Copy application link"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <a 
                  href="${item.application_url}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn btn-primary btn-sm"
                  title="Open official portal in new tab"
                >
                  <span>Apply Now</span>
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

        </div>
      `;
    }).join('');
  }

  /**
   * Renders Table Rows View
   */
  function renderTableRows(items) {
    resultsTableBody.innerHTML = items.map((item) => {
      const isSaved = state.savedIds.has(item.id);
      const deadlineBadge = getDeadlineBadge(item);

      return `
        <tr class="hover:bg-slate-50 cursor-pointer transition-colors" onclick="window.openModalById(${item.id})">
          <td class="text-center font-mono font-bold text-slate-500">
            #${item.id}
          </td>
          <td class="max-w-xs">
            <div class="font-bold text-slate-900 hover:text-blue-600">${escapeHtml(item.opportunity_name)}</div>
            <div class="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>${escapeHtml(item.continent_or_region)}</span>
              <span>•</span>
              <span>Page ${item.source_page}</span>
            </div>
          </td>
          <td class="whitespace-nowrap">
            <div class="flex flex-col gap-1">
              ${(item.categories || []).slice(0, 2).map(c => `<span class="badge badge-teal">${escapeHtml(c)}</span>`).join('')}
            </div>
          </td>
          <td class="max-w-xs text-xs text-slate-600 line-clamp-2">
            ${escapeHtml(item.eligibility_criteria)}
          </td>
          <td class="max-w-xs text-xs font-semibold text-emerald-800">
            ${escapeHtml(item.key_benefits_and_rewards)}
          </td>
          <td class="whitespace-nowrap">
            <div class="flex flex-col gap-1 items-start">
              ${deadlineBadge}
              <span class="text-[11px] text-slate-500 flex items-center gap-1 max-w-[210px] truncate" title="${escapeHtml(item.application_deadline)}">
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="truncate">${escapeHtml(item.application_deadline)}</span>
              </span>
            </div>
          </td>
          <td class="text-center whitespace-nowrap" onclick="event.stopPropagation()">
            <div class="flex items-center justify-center gap-1.5">
              <button 
                onclick="window.toggleBookmark(${item.id}); event.stopPropagation();" 
                class="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors"
                title="${isSaved ? 'Remove from Saved' : 'Save opportunity'}"
              >
                <svg class="w-4 h-4 ${isSaved ? 'text-amber-500 fill-amber-400' : ''}" fill="${isSaved ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button 
                onclick="window.openModalById(${item.id}); event.stopPropagation();" 
                class="btn btn-secondary btn-sm"
              >
                Details
              </button>
              <a 
                href="${item.application_url}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-primary btn-sm"
              >
                Apply
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Renders Pagination Controls
   */
  function renderPagination(result) {
    const { totalCount, totalPages, currentPage, perPage } = result;

    if (perPage === 'all') {
      paginationInfo.textContent = `Showing all ${totalCount} opportunities`;
      paginationButtons.innerHTML = '';
      return;
    }

    const perPageNum = parseInt(perPage, 10);
    const startIdx = (currentPage - 1) * perPageNum + 1;
    const endIdx = Math.min(currentPage * perPageNum, totalCount);

    paginationInfo.textContent = `Showing ${startIdx}–${endIdx} of ${totalCount}`;

    let btns = '';

    // First and Previous buttons
    btns += `
      <button 
        onclick="window.setPage(${currentPage - 1})" 
        class="btn btn-secondary btn-sm ${currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}"
        ${currentPage === 1 ? 'disabled' : ''}
      >
        Prev
      </button>
    `;

    // Compact page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      btns += `<button onclick="window.setPage(1)" class="btn btn-secondary btn-sm">1</button>`;
      if (startPage > 2) btns += `<span class="px-1 text-slate-400">…</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
      const activeClass = p === currentPage ? 'btn-primary' : 'btn-secondary';
      btns += `
        <button onclick="window.setPage(${p})" class="btn ${activeClass} btn-sm">
          ${p}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) btns += `<span class="px-1 text-slate-400">…</span>`;
      btns += `<button onclick="window.setPage(${totalPages})" class="btn btn-secondary btn-sm">${totalPages}</button>`;
    }

    // Next button
    btns += `
      <button 
        onclick="window.setPage(${currentPage + 1})" 
        class="btn btn-secondary btn-sm ${currentPage === totalPages ? 'opacity-40 pointer-events-none' : ''}"
        ${currentPage === totalPages ? 'disabled' : ''}
      >
        Next
      </button>
    `;

    paginationButtons.innerHTML = btns;
  }

  /**
   * Renders Active Filter Chips
   */
  function renderActiveChips() {
    const chips = [];

    if (state.search) {
      chips.push({
        label: `Search: "${state.search}"`,
        onRemove: () => {
          state.search = '';
          state.page = 1;
          refresh();
        }
      });
    }

    state.regions.forEach(r => {
      chips.push({
        label: `Region: ${r}`,
        onRemove: () => {
          state.regions = state.regions.filter(x => x !== r);
          state.page = 1;
          refresh();
        }
      });
    });

    state.categories.forEach(c => {
      chips.push({
        label: `Category: ${c}`,
        onRemove: () => {
          state.categories = state.categories.filter(x => x !== c);
          state.page = 1;
          refresh();
        }
      });
    });

    state.deadlineTypes.forEach(d => {
      chips.push({
        label: `Deadline: ${d}`,
        onRemove: () => {
          state.deadlineTypes = state.deadlineTypes.filter(x => x !== d);
          state.page = 1;
          refresh();
        }
      });
    });

    state.eligibilityTags.forEach(e => {
      chips.push({
        label: `Profile: ${e}`,
        onRemove: () => {
          state.eligibilityTags = state.eligibilityTags.filter(x => x !== e);
          state.page = 1;
          refresh();
        }
      });
    });

    if (state.onlySaved) {
      chips.push({
        label: `⭐ Saved Only`,
        onRemove: () => {
          state.onlySaved = false;
          state.page = 1;
          refresh();
        }
      });
    }

    if (state.onlyActiveDeadlines) {
      chips.push({
        label: `Active Deadlines Only`,
        onRemove: () => {
          state.onlyActiveDeadlines = false;
          state.page = 1;
          refresh();
        }
      });
    }

    if (chips.length === 0) {
      activeChipsContainer.innerHTML = '';
      return;
    }

    activeChipsContainer.innerHTML = `
      ${chips.map((chip, idx) => `
        <span class="badge badge-blue">
          <span>${escapeHtml(chip.label)}</span>
          <button onclick="window.removeChip(${idx})" class="p-0.5 hover:text-blue-900 rounded-full" title="Remove filter">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      `).join('')}
      <button onclick="window.clearAllFilters()" class="text-xs text-blue-600 hover:text-blue-800 font-semibold underline ml-1">
        Clear All
      </button>
    `;

    window._activeChipsList = chips;
  }

  window.removeChip = function (index) {
    if (window._activeChipsList && window._activeChipsList[index]) {
      window._activeChipsList[index].onRemove();
    }
  };

  /**
   * Detail Modal Drawer
   */
  window.openModalById = function (id) {
    const idx = currentFilteredList.findIndex(item => item.id === id);
    if (idx === -1) {
      const globalItem = dataset.find(item => item.id === id);
      if (globalItem) {
        currentFilteredList = [globalItem];
        currentModalIndex = 0;
      } else {
        return;
      }
    } else {
      currentModalIndex = idx;
    }

    populateModal(currentFilteredList[currentModalIndex]);
    modal.classList.add('open');
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  /**
   * Tailored Application Strategy Pro-Tips
   */
  function getCategoryProTip(item) {
    const cats = item.categories || [];

    if (cats.includes('Accelerators') || cats.includes('Incubators')) {
      return 'Accelerator committees evaluate team velocity, founder obsession, and iteration speed above all else. In your 2-minute founder video and application answers, keep it authentic — demo your working prototype or live codebase within the first 30 seconds rather than reciting high-level slides.';
    }
    if (cats.includes('Grants') || cats.includes('Competitions')) {
      return 'Non-dilutive grant committees care deeply about milestone accountability, quantifiable beneficiaries, and clear proof of impact. Ensure your 12-month budget maps specific dollar figures directly to verifiable technical or operational milestones rather than general overhead.';
    }
    if (cats.includes('Fellowships')) {
      return 'Fellowship selection panels look for personal leadership resilience and an undeniable multiplier effect. Focus your essays on a pivotal challenge you overcame, why you are uniquely qualified to solve this problem, and how you will reinvest your fellowship access into your community.';
    }
    if (cats.includes('Scholarships') || cats.includes('Research')) {
      return 'Academic selection committees prioritize intellectual clarity, alignment with host faculty research, and rigorous preparation. Secure recommendation letters from professors or research supervisors who can speak directly to your analytical resilience.';
    }
    if (cats.includes('Internships') || cats.includes('Training')) {
      return 'Technical recruiters look for tangible proof of curiosity and coachability. Link directly to your GitHub, live side projects, or a brief case study showing how you built or solved a real problem.';
    }
    return 'Reviewers evaluate hundreds of submissions per hour. De-risk your application by answering the exact prompts with specific metrics, testing all external links in an Incognito window, and completing your submission at least 48 hours before the deadline.';
  }

  function populateModal(item) {
    if (!item) return;

    modalSn.textContent = `#${item.id}`;
    modalRegion.textContent = item.continent_or_region;
    modalSourcePage.textContent = `PDF Page ${item.source_page}`;
    modalOppName.textContent = item.opportunity_name;
    modalBenefits.textContent = item.key_benefits_and_rewards;
    modalEligibility.textContent = item.eligibility_criteria;
    modalDeadline.textContent = item.application_deadline;
    modalApplyBtn.href = item.application_url;

    // Application Pro-Tip
    const modalProTip = document.getElementById('modal-pro-tip');
    if (modalProTip) {
      modalProTip.textContent = getCategoryProTip(item);
    }

    // Deadline status badge & subtext
    modalDeadlineStatusBadge.innerHTML = getDeadlineBadge(item);
    const modalDeadlineSubtext = document.getElementById('modal-deadline-subtext');
    if (modalDeadlineSubtext) {
      const statusInfo = DirectoryEngine.getDeadlineStatus(item);
      const todayFormatted = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
      modalDeadlineSubtext.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-slate-500">
          <span>${escapeHtml(statusInfo.subtext)}</span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-400">Calculated from today's date (<strong>${todayFormatted}</strong>)</span>
        </span>
      `;
    }

    // Data quality notes
    if (item.data_quality_notes) {
      modalQualityNotesBox.classList.remove('hidden');
      modalQualityNotes.textContent = item.data_quality_notes;
    } else {
      modalQualityNotesBox.classList.add('hidden');
    }

    // Categories & Derived Tags
    const tagsHTML = [
      ...(item.categories || []).map(c => `<span class="badge badge-teal">${escapeHtml(c)}</span>`),
      ...(item.eligibility_tags || []).map(t => `<span class="badge badge-slate">${escapeHtml(t)}</span>`),
      ...(item.region_tags || []).map(r => `<span class="badge badge-blue">${escapeHtml(r)}</span>`)
    ].join('');
    modalTagsContainer.innerHTML = tagsHTML;

    // Documents Checklist
    renderModalChecklist(item);

    // Star icon state
    updateModalStarIcon(item);

    // Navigation position info
    modalPositionIndicator.textContent = `${currentModalIndex + 1} of ${currentFilteredList.length}`;
    modalPrevBtn.disabled = currentModalIndex === 0;
    modalNextBtn.disabled = currentModalIndex === currentFilteredList.length - 1;
    modalPrevBtn.classList.toggle('opacity-40', currentModalIndex === 0);
    modalNextBtn.classList.toggle('opacity-40', currentModalIndex === currentFilteredList.length - 1);
  }

  function renderModalChecklist(item) {
    const docs = item.required_documents_list || [];
    const itemCheckedState = state.checklistState[item.id] || {};
    let checkedCount = 0;

    modalChecklistContainer.innerHTML = docs.map((doc, docIdx) => {
      const isChecked = Boolean(itemCheckedState[doc]);
      if (isChecked) checkedCount++;
      const inputId = `modal-doc-${item.id}-${docIdx}`;

      return `
        <div class="checklist-item">
          <input 
            type="checkbox" 
            id="${inputId}" 
            ${isChecked ? 'checked' : ''} 
            onchange="window.toggleChecklistItem(${item.id}, '${escapeHtml(doc).replace(/'/g, "\\'")}', this.checked)"
            class="rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          >
          <label for="${inputId}" class="text-xs text-slate-800 cursor-pointer flex-1">
            ${escapeHtml(doc)}
          </label>
        </div>
      `;
    }).join('');

    modalChecklistStatus.textContent = `${checkedCount} of ${docs.length} ready`;
  }

  window.toggleChecklistItem = function (itemId, docName, isChecked) {
    if (!state.checklistState[itemId]) {
      state.checklistState[itemId] = {};
    }
    state.checklistState[itemId][docName] = isChecked;
    localStorage.setItem('god_checklist_state', JSON.stringify(state.checklistState));

    // Update progress indicator
    const currentItem = currentFilteredList[currentModalIndex];
    if (currentItem && currentItem.id === itemId) {
      const docs = currentItem.required_documents_list || [];
      const checkedCount = docs.filter(d => state.checklistState[itemId][d]).length;
      modalChecklistStatus.textContent = `${checkedCount} of ${docs.length} ready`;
    }
  };

  function updateModalStarIcon(item) {
    const isSaved = state.savedIds.has(item.id);
    modalStarIcon.setAttribute('fill', isSaved ? 'currentColor' : 'none');
    modalStarIcon.classList.toggle('text-amber-500', isSaved);
    modalStarIcon.classList.toggle('fill-amber-400', isSaved);
  }

  window.closeModal = function () {
    modal.classList.remove('open');
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  function stepModal(dir) {
    const newIdx = currentModalIndex + dir;
    if (newIdx >= 0 && newIdx < currentFilteredList.length) {
      currentModalIndex = newIdx;
      populateModal(currentFilteredList[currentModalIndex]);
    }
  }

  /**
   * Bookmark / Shortlist Management
   */
  window.toggleBookmark = function (id) {
    if (state.savedIds.has(id)) {
      state.savedIds.delete(id);
      showToast(`Removed #${id} from saved shortlist`);
    } else {
      state.savedIds.add(id);
      showToast(`Saved #${id} to your shortlist!`);
    }

    localStorage.setItem('god_saved_ids', JSON.stringify(Array.from(state.savedIds)));
    updateSavedCounter();

    if (currentFilteredList[currentModalIndex] && currentFilteredList[currentModalIndex].id === id) {
      updateModalStarIcon(currentFilteredList[currentModalIndex]);
    }

    refresh();
  };

  function updateSavedCounter() {
    const count = state.savedIds.size;
    savedCounter.textContent = count;
    const bottomSaved = document.getElementById('bottom-saved-count');
    if (bottomSaved) bottomSaved.textContent = `${count} Saved`;
  }

  /**
   * Pagination Jump
   */
  window.setPage = function (pageNum) {
    state.page = pageNum;
    refresh();
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  /**
   * Reset All Filters
   */
  window.clearAllFilters = function () {
    state.search = '';
    state.regions = [];
    state.categories = [];
    state.deadlineTypes = [];
    state.eligibilityTags = [];
    state.onlySaved = false;
    state.onlyActiveDeadlines = false;
    state.sort = 'name-asc';
    state.page = 1;

    // Reset persona pills
    document.querySelectorAll('.persona-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-persona') === 'all');
    });

    refresh();
    showToast('All filters reset');
  };

  /**
   * Persona Quick-Filter Handler (Who It's For)
   */
  window.applyPersonaFilter = function (personaKey) {
    state.search = '';
    if (searchInput) searchInput.value = '';
    state.regions = [];
    state.categories = [];
    state.deadlineTypes = [];
    state.eligibilityTags = [];
    state.onlySaved = false;
    state.onlyActiveDeadlines = false;
    state.page = 1;

    if (personaKey === 'startups') {
      state.eligibilityTags = ['Startups', 'Entrepreneurs'];
      showToast('Filtered for Founders & Startups (79 programs)');
    } else if (personaKey === 'women') {
      state.eligibilityTags = ['Women'];
      showToast('Filtered for Women in Tech & Female Founders (25 programs)');
    } else if (personaKey === 'youth') {
      state.eligibilityTags = ['Young professionals', 'Graduates'];
      showToast('Filtered for Young Professionals & Developers (28 programs)');
    } else if (personaKey === 'students') {
      state.eligibilityTags = ['Students', 'Researchers'];
      showToast('Filtered for Students & Researchers (28 programs)');
    } else if (personaKey === 'smes') {
      state.eligibilityTags = ['SMEs/business owners', 'NGOs'];
      showToast('Filtered for MSMEs & Grassroots Innovators (34 programs)');
    } else {
      showToast('Showing all 138 opportunities');
    }

    // Update persona pills active state
    document.querySelectorAll('.persona-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-persona') === personaKey);
    });

    // Close playbook modal if open
    window.closePlaybookModal();

    refresh();
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  /**
   * Playbook Modal Controls
   */
  const playbookModal = document.getElementById('playbook-modal');
  const playbookBackdrop = document.getElementById('playbook-modal-backdrop');

  window.openPlaybookModal = function (tabName = 'tab-overview') {
    if (!playbookModal || !playbookBackdrop) return;
    playbookModal.classList.add('open');
    playbookBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (tabName) window.switchPlaybookTab(tabName);
  };

  window.closePlaybookModal = function () {
    if (!playbookModal || !playbookBackdrop) return;
    playbookModal.classList.remove('open');
    playbookBackdrop.classList.remove('open');
    if (!modal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  window.switchPlaybookTab = function (tabId) {
    document.querySelectorAll('.playbook-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.playbook-tab-content').forEach(content => {
      content.classList.toggle('hidden', content.id !== tabId);
    });
  };

  /**
   * Copy Link Helper
   */
  window.copyOpportunityLink = function (url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Application link copied to clipboard!');
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Application link copied to clipboard!');
    } catch (e) {
      showToast('Failed to copy');
    }
    document.body.removeChild(textarea);
  }

  /**
   * Export Filtered CSV
   */
  function handleExportCSV() {
    if (!currentFilteredList || currentFilteredList.length === 0) {
      showToast('No opportunities to export');
      return;
    }

    const csvData = DirectoryEngine.generateCSV(currentFilteredList);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `InnovationAtlas_Directory_${dateStamp}.csv`;

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);

    showToast(`Exported ${currentFilteredList.length} opportunities to CSV`);
  }

  /**
   * URL State Sync
   */
  function updateURLState() {
    const queryString = DirectoryEngine.serializeStateToQueryParams(state);
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }

  function restoreStateFromURL() {
    const urlState = DirectoryEngine.deserializeQueryParamsToState();
    if (urlState.search !== undefined) state.search = urlState.search;
    if (urlState.regions !== undefined) state.regions = urlState.regions;
    if (urlState.categories !== undefined) state.categories = urlState.categories;
    if (urlState.deadlineTypes !== undefined) state.deadlineTypes = urlState.deadlineTypes;
    if (urlState.eligibilityTags !== undefined) state.eligibilityTags = urlState.eligibilityTags;
    if (urlState.onlySaved !== undefined) state.onlySaved = urlState.onlySaved;
    if (urlState.onlyActiveDeadlines !== undefined) state.onlyActiveDeadlines = urlState.onlyActiveDeadlines;
    if (urlState.sort !== undefined) state.sort = urlState.sort;
    if (urlState.perPage !== undefined) state.perPage = urlState.perPage;
    if (urlState.page !== undefined) state.page = urlState.page;
    if (urlState.viewMode !== undefined) state.viewMode = urlState.viewMode;
  }

  /**
   * Toast notification feedback
   */
  function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'error' 
      ? `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      : `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;

    toast.innerHTML = `${icon}<span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  }

  /**
   * Event Listeners Registration
   */
  function attachEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value.trim();
      state.page = 1;
      refresh();
    });

    searchClearBtn.addEventListener('click', () => {
      state.search = '';
      searchInput.value = '';
      state.page = 1;
      searchInput.focus();
      refresh();
    });

    // Filter drawer toggle
    toggleFilterBtn.addEventListener('click', () => {
      filterDrawer.classList.toggle('hidden');
    });

    clearAllFiltersBtn.addEventListener('click', window.clearAllFilters);
    resetEmptyBtn.addEventListener('click', window.clearAllFilters);

    // Sort select
    sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.page = 1;
      refresh();
    });

    // Active deadlines toggle
    toggleActiveDeadlines.addEventListener('change', (e) => {
      state.onlyActiveDeadlines = e.target.checked;
      state.page = 1;
      refresh();
    });

    // Saved shortlist toggle
    toggleSavedBtn.addEventListener('click', () => {
      state.onlySaved = !state.onlySaved;
      state.page = 1;
      refresh();
    });

    // Per page select
    perPageSelect.addEventListener('change', (e) => {
      state.perPage = e.target.value;
      state.page = 1;
      refresh();
    });

    // View switcher
    viewCardsBtn.addEventListener('click', () => {
      state.viewMode = 'cards';
      refresh();
    });
    viewTableBtn.addEventListener('click', () => {
      state.viewMode = 'table';
      refresh();
    });

    // Map view collapse/expand toggle
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    const toggleMapText = document.getElementById('toggle-map-text');
    const mapSvgContainer = document.getElementById('map-svg-container');
    if (toggleMapBtn && mapSvgContainer) {
      toggleMapBtn.addEventListener('click', () => {
        const isHidden = mapSvgContainer.classList.toggle('hidden');
        if (toggleMapText) {
          toggleMapText.textContent = isHidden ? 'Show Map' : 'Hide Map';
        }
      });
    }

    // Map pills click handler
    const mapPillsBar = document.getElementById('map-pills-bar');
    if (mapPillsBar) {
      mapPillsBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.map-pill');
        if (!pill) return;
        const reg = pill.getAttribute('data-map-region');
        if (reg === 'all') {
          state.regions = [];
        } else {
          state.regions = [reg];
        }
        state.page = 1;
        refresh();
      });
    }

    // Map pins and continent paths click handler
    const mapSection = document.getElementById('map-section');
    if (mapSection) {
      mapSection.addEventListener('click', (e) => {
        const target = e.target.closest('.map-pin-group, .continent-path');
        if (!target) return;
        const reg = target.getAttribute('data-region');
        if (!reg) return;

        if (state.regions.includes(reg)) {
          state.regions = state.regions.filter(r => r !== reg);
        } else {
          state.regions = [reg];
        }
        state.page = 1;
        refresh();

        // Smooth scroll to results
        const resultsEl = document.getElementById('results-count-text');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Export CSV
    exportCsvBtn.addEventListener('click', handleExportCSV);

    // Checkbox groups delegated listeners
    regionFiltersList.addEventListener('change', () => {
      state.regions = Array.from(regionFiltersList.querySelectorAll('input:checked')).map(cb => cb.value);
      state.page = 1;
      refresh();
    });

    categoryFiltersList.addEventListener('change', () => {
      state.categories = Array.from(categoryFiltersList.querySelectorAll('input:checked')).map(cb => cb.value);
      state.page = 1;
      refresh();
    });

    deadlineFiltersList.addEventListener('change', () => {
      state.deadlineTypes = Array.from(deadlineFiltersList.querySelectorAll('input:checked')).map(cb => cb.value);
      state.page = 1;
      refresh();
    });

    eligibilityFiltersList.addEventListener('change', () => {
      state.eligibilityTags = Array.from(eligibilityFiltersList.querySelectorAll('input:checked')).map(cb => cb.value);
      state.page = 1;
      refresh();
    });

    // Table header sortable click delegation
    document.querySelectorAll('.data-table thead th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const targetSort = th.getAttribute('data-sort');
        if (state.sort === targetSort) {
          // Toggle asc/desc
          if (targetSort === 'name-asc') state.sort = 'name-desc';
          else if (targetSort === 'name-desc') state.sort = 'name-asc';
          else if (targetSort === 'deadline-asc') state.sort = 'deadline-desc';
          else if (targetSort === 'deadline-desc') state.sort = 'deadline-asc';
        } else {
          state.sort = targetSort;
        }
        state.page = 1;
        refresh();
      });
    });

    // Modal navigation
    modalCloseBtn.addEventListener('click', window.closeModal);
    modalBackdrop.addEventListener('click', window.closeModal);
    modalPrevBtn.addEventListener('click', () => stepModal(-1));
    modalNextBtn.addEventListener('click', () => stepModal(1));

    modalCopyBtn.addEventListener('click', () => {
      const currentItem = currentFilteredList[currentModalIndex];
      if (currentItem) window.copyOpportunityLink(currentItem.application_url);
    });

    modalStarBtn.addEventListener('click', () => {
      const currentItem = currentFilteredList[currentModalIndex];
      if (currentItem) window.toggleBookmark(currentItem.id);
    });

    // Playbook Modal triggers
    const openPlaybookBtn = document.getElementById('open-playbook-btn');
    if (openPlaybookBtn) openPlaybookBtn.addEventListener('click', () => window.openPlaybookModal('tab-overview'));

    const bannerPlaybookBtn = document.getElementById('banner-playbook-btn');
    if (bannerPlaybookBtn) bannerPlaybookBtn.addEventListener('click', () => window.openPlaybookModal('tab-principles'));

    const guideLinkBtn = document.getElementById('guide-link-btn');
    if (guideLinkBtn) guideLinkBtn.addEventListener('click', () => window.openPlaybookModal('tab-principles'));

    const playbookCloseBtn = document.getElementById('playbook-close-btn');
    if (playbookCloseBtn) playbookCloseBtn.addEventListener('click', window.closePlaybookModal);

    if (playbookBackdrop) playbookBackdrop.addEventListener('click', window.closePlaybookModal);

    // Playbook Tab Buttons Delegation
    document.querySelectorAll('.playbook-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        window.switchPlaybookTab(tabId);
      });
    });

    // Persona Pills Delegation
    document.querySelectorAll('.persona-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.getAttribute('data-persona');
        window.applyPersonaFilter(pKey);
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (playbookModal && playbookModal.classList.contains('open')) {
        if (e.key === 'Escape') {
          window.closePlaybookModal();
        }
      } else if (modal.classList.contains('open')) {
        if (e.key === 'Escape') {
          window.closeModal();
        } else if (e.key === 'ArrowLeft') {
          stepModal(-1);
        } else if (e.key === 'ArrowRight') {
          stepModal(1);
        }
      } else {
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        } else if (e.key === 'Escape' && state.search) {
          state.search = '';
          searchInput.value = '';
          state.page = 1;
          refresh();
        }
      }
    });
  }

  // Self-start on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);

})();
