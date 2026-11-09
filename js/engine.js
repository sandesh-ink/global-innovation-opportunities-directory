// Engine: Global Innovation Opportunities Directory
// Independent data processing, full-text search, multi-faceted filtering, sorting, pagination, and state serialization.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DirectoryEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CURRENT_SYSTEM_DATE = "2026-11-09";

  /**
   * Tokenizes text for case-insensitive search with special character normalization
   */
  function tokenize(str) {
    if (!str) return [];
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9#\+]/)
      .filter(t => t.length > 0);
  }

  /**
   * Checks if an opportunity matches search query tokens
   */
  function matchesSearch(item, tokens) {
    if (!tokens || tokens.length === 0) return true;

    const searchableBlob = [
      item.id,
      item.opportunity_name,
      item.continent_or_region,
      item.eligibility_criteria,
      item.key_benefits_and_rewards,
      item.required_documents,
      item.application_deadline,
      item.deadline_type,
      (item.categories || []).join(' '),
      (item.eligibility_tags || []).join(' '),
      (item.region_tags || []).join(' '),
      item.data_quality_notes || ''
    ].join(' ').toLowerCase();

    // Every token must match at least partially in the searchable blob
    return tokens.every(token => searchableBlob.includes(token));
  }

  /**
   * Calculates deadline status relative to a reference date (defaults to today)
   */
  function getDeadlineStatus(item, referenceDate) {
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());

    if (item.deadline_date) {
      const parts = item.deadline_date.split('-');
      const deadline = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        const daysText = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
        return {
          type: 'passed',
          diffDays,
          isPast: true,
          badgeText: `Passed (${daysAgo}d ago)`,
          badgeClass: 'badge-amber',
          title: `Listed deadline (${item.application_deadline}) was ${daysText}. Verify current status with provider.`,
          subtext: `Listed deadline passed ${daysText} — verify with provider`,
          icon: 'warning'
        };
      }

      if (diffDays === 0) {
        return {
          type: 'today',
          diffDays: 0,
          isPast: false,
          badgeText: 'Closes Today!',
          badgeClass: 'badge-rose font-bold animate-pulse',
          title: `Application closes today (${item.application_deadline})!`,
          subtext: 'Final day to submit your application',
          icon: 'clock-urgent'
        };
      }

      if (diffDays === 1) {
        return {
          type: 'tomorrow',
          diffDays: 1,
          isPast: false,
          badgeText: 'Closes Tomorrow (1d left)',
          badgeClass: 'badge-orange font-bold',
          title: `Application closes tomorrow (${item.application_deadline})!`,
          subtext: 'Only 1 day left before deadline',
          icon: 'clock'
        };
      }

      if (diffDays <= 7) {
        return {
          type: 'closing-soon',
          diffDays,
          isPast: false,
          badgeText: `Closing Soon (${diffDays}d left)`,
          badgeClass: 'badge-orange font-semibold',
          title: `Application closes in ${diffDays} days (${item.application_deadline})`,
          subtext: `Closing soon: ${diffDays} days remaining`,
          icon: 'clock'
        };
      }

      if (diffDays <= 30) {
        return {
          type: 'open-soon',
          diffDays,
          isPast: false,
          badgeText: `Open (${diffDays}d left)`,
          badgeClass: 'badge-emerald',
          title: `Open, ${diffDays} days remaining until ${item.application_deadline}`,
          subtext: `${diffDays} days remaining until application deadline`,
          icon: 'calendar-check'
        };
      }

      const months = Math.round(diffDays / 30);
      const monthsText = months <= 1 ? '1 mo' : `${months} mos`;
      return {
        type: 'open',
        diffDays,
        isPast: false,
        badgeText: `Open (${diffDays}d left)`,
        badgeClass: 'badge-emerald',
        title: `Open, ${diffDays} days remaining (~${monthsText}) until ${item.application_deadline}`,
        subtext: `${diffDays} days remaining (~${monthsText}) until application deadline`,
        icon: 'calendar-check'
      };
    }

    if (item.deadline_type === 'Rolling' || item.deadline_type === 'Continuous intake') {
      return {
        type: 'rolling',
        diffDays: null,
        isPast: false,
        badgeText: 'Active: Rolling Intake',
        badgeClass: 'badge-emerald',
        title: 'Applications reviewed continuously on a rolling intake schedule',
        subtext: 'Rolling intake — applications accepted on an ongoing basis',
        icon: 'refresh'
      };
    }

    if (item.deadline_type === 'Varies by cohort') {
      return {
        type: 'cohort',
        diffDays: null,
        isPast: false,
        badgeText: 'Cohort Intake',
        badgeClass: 'badge-teal',
        title: 'Intake deadlines vary by cohort schedule — check provider portal',
        subtext: 'Cohort-based scheduling — check provider website for next cohort dates',
        icon: 'layers'
      };
    }

    if (item.deadline_type === 'Quarterly') {
      return {
        type: 'quarterly',
        diffDays: null,
        isPast: false,
        badgeText: 'Quarterly Intake',
        badgeClass: 'badge-teal',
        title: 'Recurring quarterly intake windows',
        subtext: 'Quarterly review cycle — applications evaluated 4 times per year',
        icon: 'refresh'
      };
    }

    if (item.deadline_type === 'Annual or recurring') {
      return {
        type: 'annual',
        diffDays: null,
        isPast: false,
        badgeText: 'Annual Cycle',
        badgeClass: 'badge-teal',
        title: 'Annual recurring cycle — check provider portal for next calendar intake',
        subtext: 'Annual intake cycle — check official portal for current year dates',
        icon: 'calendar'
      };
    }

    if (item.deadline_type === 'Check portal') {
      return {
        type: 'portal',
        diffDays: null,
        isPast: false,
        badgeText: 'Check Portal',
        badgeClass: 'badge-slate',
        title: 'Application deadlines published directly on provider website',
        subtext: 'Check program website for current intake schedule',
        icon: 'link'
      };
    }

    return {
      type: 'other',
      diffDays: null,
      isPast: false,
      badgeText: 'Verify with Provider',
      badgeClass: 'badge-slate',
      title: `Deadline: ${item.application_deadline} — verify current status with provider`,
      subtext: 'Check program website for current status and deadlines',
      icon: 'info'
    };
  }

  /**
   * Helper to determine if an opportunity's listed deadline has passed relative to a reference date
   */
  function isPastDeadline(item, referenceDate) {
    const status = getDeadlineStatus(item, referenceDate);
    return Boolean(status.isPast);
  }

  /**
   * Core Filtering and Sorting function
   */
  function filterAndSort(dataset, options = {}) {
    const {
      search = '',
      regions = [],
      categories = [],
      deadlineTypes = [],
      eligibilityTags = [],
      onlySaved = false,
      savedIds = new Set(),
      onlyActiveDeadlines = false,
      referenceDate = null,
      sort = 'name-asc',
      page = 1,
      perPage = 20
    } = options;

    const tokens = tokenize(search);

    // 1. Filter
    const filtered = dataset.filter(item => {
      // Saved / Bookmarks filter
      if (onlySaved && !savedIds.has(item.id)) {
        return false;
      }

      // Past deadline exclusion toggle if enabled (calculated dynamically against reference/today date)
      if (onlyActiveDeadlines && isPastDeadline(item, referenceDate)) {
        return false;
      }

      // Search match
      if (!matchesSearch(item, tokens)) {
        return false;
      }

      // Region Filter (OR among selected regions)
      if (regions && regions.length > 0) {
        const itemRegions = item.region_tags || [];
        const hasRegion = regions.some(r => itemRegions.includes(r) || item.continent_or_region.includes(r));
        if (!hasRegion) return false;
      }

      // Category Filter (OR among selected categories)
      if (categories && categories.length > 0) {
        const itemCats = item.categories || [];
        const hasCat = categories.some(c => itemCats.includes(c));
        if (!hasCat) return false;
      }

      // Deadline Type Filter (OR among selected types)
      if (deadlineTypes && deadlineTypes.length > 0) {
        const hasDeadlineType = deadlineTypes.includes(item.deadline_type);
        if (!hasDeadlineType) return false;
      }

      // Eligibility Tags Filter (OR among selected eligibility tags)
      if (eligibilityTags && eligibilityTags.length > 0) {
        const itemTags = item.eligibility_tags || [];
        const hasTag = eligibilityTags.some(t => itemTags.includes(t));
        if (!hasTag) return false;
      }

      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.opportunity_name.localeCompare(b.opportunity_name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name-desc':
          return b.opportunity_name.localeCompare(a.opportunity_name, undefined, { numeric: true, sensitivity: 'base' });

        case 'deadline-asc': {
          // Rule: Handle rolling and unknown deadlines separately from actual dates.
          // Dated deadlines come first, sorted chronologically from earliest to latest.
          const aDated = Boolean(a.deadline_date);
          const bDated = Boolean(b.deadline_date);

          if (aDated && bDated) {
            return a.deadline_date.localeCompare(b.deadline_date) || a.opportunity_name.localeCompare(b.opportunity_name);
          }
          if (aDated && !bDated) return -1;
          if (!aDated && bDated) return 1;
          return a.opportunity_name.localeCompare(b.opportunity_name);
        }

        case 'deadline-desc': {
          // Dated deadlines sorted descending from latest to earliest.
          const aDated = Boolean(a.deadline_date);
          const bDated = Boolean(b.deadline_date);

          if (aDated && bDated) {
            return b.deadline_date.localeCompare(a.deadline_date) || a.opportunity_name.localeCompare(b.opportunity_name);
          }
          if (aDated && !bDated) return -1;
          if (!aDated && bDated) return 1;
          return a.opportunity_name.localeCompare(b.opportunity_name);
        }

        case 'region':
          return a.continent_or_region.localeCompare(b.continent_or_region) || a.opportunity_name.localeCompare(b.opportunity_name);

        case 'category': {
          const aCat = (a.categories && a.categories[0]) || '';
          const bCat = (b.categories && b.categories[0]) || '';
          return aCat.localeCompare(bCat) || a.opportunity_name.localeCompare(b.opportunity_name);
        }

        case 'name-asc':
        default:
          return a.opportunity_name.localeCompare(b.opportunity_name, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

    // 3. Pagination
    const totalCount = filtered.length;
    let paginatedItems = filtered;
    let totalPages = 1;
    let normalizedPage = 1;

    if (perPage !== 'all') {
      const perPageNum = parseInt(perPage, 10) || 20;
      totalPages = Math.max(1, Math.ceil(totalCount / perPageNum));
      normalizedPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
      const startIdx = (normalizedPage - 1) * perPageNum;
      paginatedItems = filtered.slice(startIdx, startIdx + perPageNum);
    } else {
      normalizedPage = 1;
      totalPages = 1;
    }

    return {
      items: paginatedItems,
      allFiltered: filtered,
      totalCount,
      totalPages,
      currentPage: normalizedPage,
      perPage
    };
  }

  /**
   * Computes top-level directory metrics
   */
  function computeDirectoryStats(dataset, referenceDate) {
    const totalOpportunities = dataset.length;
    const uniqueRegions = new Set();
    let rollingCount = 0;
    let datedDeadlinesCount = 0;
    let passedDeadlinesCount = 0;

    dataset.forEach(item => {
      (item.region_tags || []).forEach(r => uniqueRegions.add(r));
      if (item.deadline_type === 'Rolling' || item.deadline_type === 'Continuous intake') {
        rollingCount++;
      }
      if (item.deadline_date) {
        datedDeadlinesCount++;
      }
      if (isPastDeadline(item, referenceDate)) {
        passedDeadlinesCount++;
      }
    });

    return {
      totalOpportunities,
      regionsCoveredCount: uniqueRegions.size,
      rollingCount,
      datedDeadlinesCount,
      passedDeadlinesCount,
      regionsList: Array.from(uniqueRegions).sort()
    };
  }

  /**
   * Generates CSV string for filtered items (RFC 4180 standard)
   */
  function generateCSV(items) {
    const headers = [
      'ID (S/N)',
      'Opportunity Name',
      'Host Continent / Region',
      'Categories',
      'Eligibility Criteria',
      'Key Benefits and Rewards',
      'Required Documents',
      'Application Deadline',
      'Normalized Deadline Date',
      'Deadline Type',
      'Deadline Status',
      'Application URL',
      'Source Page in PDF',
      'Data Quality Notes'
    ];

    function escapeCSVCell(val) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = items.map(item => {
      const status = getDeadlineStatus(item);
      return [
        item.id,
        escapeCSVCell(item.opportunity_name),
        escapeCSVCell(item.continent_or_region),
        escapeCSVCell((item.categories || []).join('; ')),
        escapeCSVCell(item.eligibility_criteria),
        escapeCSVCell(item.key_benefits_and_rewards),
        escapeCSVCell(item.required_documents),
        escapeCSVCell(item.application_deadline),
        escapeCSVCell(item.deadline_date || 'N/A'),
        escapeCSVCell(item.deadline_type),
        escapeCSVCell(status.badgeText),
        escapeCSVCell(item.application_url),
        item.source_page,
        escapeCSVCell(item.data_quality_notes || '')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    return csvContent;
  }

  /**
   * URL State Serialization
   */
  function serializeStateToQueryParams(state) {
    const params = new URLSearchParams();

    if (state.search) params.set('q', state.search);
    if (state.regions && state.regions.length > 0) params.set('regions', state.regions.join(','));
    if (state.categories && state.categories.length > 0) params.set('categories', state.categories.join(','));
    if (state.deadlineTypes && state.deadlineTypes.length > 0) params.set('deadlines', state.deadlineTypes.join(','));
    if (state.eligibilityTags && state.eligibilityTags.length > 0) params.set('eligibility', state.eligibilityTags.join(','));
    if (state.onlySaved) params.set('saved', 'true');
    if (state.onlyActiveDeadlines) params.set('activeOnly', 'true');
    if (state.sort && state.sort !== 'name-asc') params.set('sort', state.sort);
    if (state.perPage && state.perPage !== 20) params.set('perPage', state.perPage);
    if (state.page && state.page > 1) params.set('page', state.page);
    if (state.viewMode && state.viewMode !== 'cards') params.set('view', state.viewMode);

    return params.toString();
  }

  /**
   * URL State Deserialization
   */
  function deserializeQueryParamsToState() {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const state = {};

    if (params.has('q')) state.search = params.get('q');
    if (params.has('regions')) state.regions = params.get('regions').split(',').filter(Boolean);
    if (params.has('categories')) state.categories = params.get('categories').split(',').filter(Boolean);
    if (params.has('deadlines')) state.deadlineTypes = params.get('deadlines').split(',').filter(Boolean);
    if (params.has('eligibility')) state.eligibilityTags = params.get('eligibility').split(',').filter(Boolean);
    if (params.has('saved')) state.onlySaved = params.get('saved') === 'true';
    if (params.has('activeOnly')) state.onlyActiveDeadlines = params.get('activeOnly') === 'true';
    if (params.has('sort')) state.sort = params.get('sort');
    if (params.has('perPage')) {
      const pp = params.get('perPage');
      state.perPage = pp === 'all' ? 'all' : parseInt(pp, 10);
    }
    if (params.has('page')) state.page = parseInt(params.get('page'), 10) || 1;
    if (params.has('view')) state.viewMode = params.get('view');

    return state;
  }

  return {
    filterAndSort,
    computeDirectoryStats,
    getDeadlineStatus,
    isPastDeadline,
    generateCSV,
    serializeStateToQueryParams,
    deserializeQueryParamsToState,
    tokenize
  };
}));
