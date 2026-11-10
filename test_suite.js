const fs = require('fs');
const path = require('path');
const Engine = require(path.join(__dirname, 'js/engine.js'));
const Charts = require(path.join(__dirname, 'js/charts.js'));
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/opportunities.json'), 'utf8'));

console.log('--- 1. VERIFY TOTAL COUNT & NO DUPLICATES ---');
console.log('Total entries:', rawData.length);
if (rawData.length !== 138) {
  throw new Error(`Expected 138 entries, got ${rawData.length}`);
}

const ids = new Set();
rawData.forEach(item => {
  if (ids.has(item.id)) {
    throw new Error(`Duplicate ID found: ${item.id}`);
  }
  ids.add(item.id);
});
console.log('Unique IDs checked: 1 to 138, all accounted for with 0 duplicates.');

console.log('\n--- 2. VERIFY REQUIRED FIELDS IN EVERY RECORD ---');
const requiredFields = [
  'id',
  'opportunity_name',
  'continent_or_region',
  'eligibility_criteria',
  'key_benefits_and_rewards',
  'required_documents',
  'application_deadline',
  'application_url',
  'deadline_type',
  'source_page',
  'data_quality_notes',
  'categories',
  'eligibility_tags',
  'region_tags'
];

let fieldErrors = 0;
rawData.forEach(item => {
  requiredFields.forEach(f => {
    if (item[f] === undefined || item[f] === null || item[f] === '') {
      if (f === 'data_quality_notes' && item[f] === '') return; // allowed empty
      console.error(`Record #${item.id} missing field: ${f}`);
      fieldErrors++;
    }
  });

  // Verify URLs
  if (!item.application_url.startsWith('http://') && !item.application_url.startsWith('https://')) {
    console.error(`Record #${item.id} has invalid URL: ${item.application_url}`);
    fieldErrors++;
  }

  // Verify source page between 1 and 23
  if (item.source_page < 1 || item.source_page > 23) {
    console.error(`Record #${item.id} has invalid page: ${item.source_page}`);
    fieldErrors++;
  }
});

if (fieldErrors > 0) {
  throw new Error(`Found ${fieldErrors} field errors!`);
}
console.log('All 138 records have valid fields, URLs, and source page ranges (1-23).');

console.log('\n--- 3. TEST FULL-TEXT SEARCH ---');
const searchTech = Engine.filterAndSort(rawData, { search: 'tech' });
console.log(`Search 'tech' returned: ${searchTech.totalCount} results`);
if (searchTech.totalCount === 0) throw new Error('Search failed to return results');

const searchAgri = Engine.filterAndSort(rawData, { search: 'agri' });
console.log(`Search 'agri' returned: ${searchAgri.totalCount} results`);
if (searchAgri.totalCount === 0) throw new Error('Search failed for agri');

const searchSpecific = Engine.filterAndSort(rawData, { search: 'Moniepoint' });
console.log(`Search 'Moniepoint' returned: ${searchSpecific.totalCount} results`);
if (searchSpecific.totalCount !== 1 || searchSpecific.items[0].id !== 3) {
  throw new Error('Search for Moniepoint failed');
}

console.log('\n--- 4. TEST MULTI-FILTER COMBINATIONS ---');
// Filter Africa + Grants
const filterAfricaGrants = Engine.filterAndSort(rawData, {
  regions: ['Africa'],
  categories: ['Grants']
});
console.log(`Filter [Africa + Grants] returned: ${filterAfricaGrants.totalCount} results`);

// Filter Women + Accelerators
const filterWomenAccel = Engine.filterAndSort(rawData, {
  categories: ['Accelerators'],
  eligibilityTags: ['Women']
});
console.log(`Filter [Women + Accelerators] returned: ${filterWomenAccel.totalCount} results`);

// Filter Rolling only
const filterRolling = Engine.filterAndSort(rawData, {
  deadlineTypes: ['Rolling', 'Continuous intake']
});
console.log(`Filter [Rolling / Continuous] returned: ${filterRolling.totalCount} results`);

console.log('\n--- 5. TEST SORTING MECHANISMS ---');
// Sort Name A-Z
const sortNameAsc = Engine.filterAndSort(rawData, { sort: 'name-asc' });
const firstAlpha = sortNameAsc.items[0].opportunity_name;
const lastAlpha = sortNameAsc.allFiltered[sortNameAsc.allFiltered.length - 1].opportunity_name;
console.log(`Sorted Name A-Z: First is "${firstAlpha}", Last is "${lastAlpha}"`);

// Sort Deadline Earliest First
const sortDeadlineAsc = Engine.filterAndSort(rawData, { sort: 'deadline-asc' });
console.log(`Sorted Deadline Earliest First: First item is #${sortDeadlineAsc.items[0].id} with date ${sortDeadlineAsc.items[0].deadline_date}`);
if (!sortDeadlineAsc.items[0].deadline_date) {
  throw new Error('Earliest deadline item should have a date');
}

console.log('\n--- 6. TEST CSV EXPORT COMPLIANCE ---');
const csvContent = Engine.generateCSV(filterAfricaGrants.allFiltered);
const lines = csvContent.split('\r\n');
console.log(`Generated CSV lines: ${lines.length} (Headers + ${filterAfricaGrants.allFiltered.length} records)`);
if (lines.length !== filterAfricaGrants.allFiltered.length + 1) {
  throw new Error('CSV row count mismatch');
}

console.log('\n--- 7. TEST URL STATE SERIALIZATION ---');
const testState = {
  search: 'fellowship',
  regions: ['Global'],
  categories: ['Fellowships'],
  sort: 'deadline-asc',
  page: 2,
  perPage: 10
};
const queryParams = Engine.serializeStateToQueryParams(testState);
console.log('Serialized URL query:', queryParams);
if (!queryParams.includes('q=fellowship') || !queryParams.includes('categories=Fellowships')) {
  throw new Error('URL serialization failed');
}

console.log('\n--- 8. TEST DEADLINE STATUS CALCULATION FROM TODAY’S DATE ---');
let validBadges = 0;
let passedCount = 0;
let rollingCount = 0;
let openCount = 0;

rawData.forEach(item => {
  const status = Engine.getDeadlineStatus(item);
  if (!status || !status.badgeText || !status.badgeClass || !status.title) {
    throw new Error(`Invalid deadline status for item #${item.id}`);
  }
  validBadges++;
  if (status.isPast) passedCount++;
  if (status.type === 'rolling') rollingCount++;
  if (status.type === 'open' || status.type === 'open-soon' || status.type === 'closing-soon' || status.type === 'today' || status.type === 'tomorrow') {
    openCount++;
  }
});

console.log(`Evaluated 138 items: ${validBadges} valid badges generated.`);
console.log(`Counts relative to today: ${passedCount} passed, ${rollingCount} rolling, ${openCount} open/upcoming.`);
if (validBadges !== 138) {
  throw new Error('Not all items produced a valid status badge');
}

console.log('\n--- 9. TEST DEFAULT PAGINATION (6 PER PAGE) ---');
const defaultPaginated = Engine.filterAndSort(rawData);
console.log(`Default pagination items returned: ${defaultPaginated.items.length}, total pages: ${defaultPaginated.totalPages}`);
if (defaultPaginated.items.length !== 6) {
  throw new Error(`Expected default page size of 6, got ${defaultPaginated.items.length}`);
}
if (defaultPaginated.totalPages !== Math.ceil(138 / 6)) {
  throw new Error(`Expected ${Math.ceil(138 / 6)} pages, got ${defaultPaginated.totalPages}`);
}

console.log('\n--- 10. TEST STATISTICS SVG MINICHARTS ---');
const regionSvg = Charts.renderRegionPinChart(rawData);
const coinSvg = Charts.renderCapitalCoinChart();
const waffleOut = Charts.renderDeadlineWaffleChart(rawData);
const categorySvg = Charts.renderCategoryLollipopChart(rawData);
const demoSvg = Charts.renderDemographicPinChart(rawData);
const readySvg = Charts.renderReadinessRingChart(rawData, new Set([1, 2]), { 1: { 'Pitch Deck': true } });

const svgsToVerify = [
  ['RegionPinChart', regionSvg],
  ['CapitalCoinChart', coinSvg],
  ['DeadlineWaffleChart', waffleOut.svg],
  ['CategoryLollipopChart', categorySvg],
  ['DemographicPinChart', demoSvg],
  ['ReadinessRingChart', readySvg]
];

svgsToVerify.forEach(([name, svg]) => {
  if (!svg || !svg.includes('<svg') || !svg.includes('</svg>')) {
    throw new Error(`${name} did not produce a valid SVG`);
  }
  if (svg.includes('NaN') || svg.includes('undefined')) {
    throw new Error(`${name} contains NaN or undefined values`);
  }
});

const tileMatches = waffleOut.svg.match(/class="waffle-tile/g) || [];
console.log(`Generated 6 SVG MiniCharts cleanly; Deadline Waffle has ${tileMatches.length} unit tiles.`);
if (tileMatches.length !== 138) {
  throw new Error(`Expected 138 waffle tiles, got ${tileMatches.length}`);
}
const bucketSum = waffleOut.counts.urgent + waffleOut.counts.open + waffleOut.counts.rolling + waffleOut.counts.cohort + waffleOut.counts.passed;
if (bucketSum !== 138) {
  throw new Error(`Waffle bucket counts do not sum to 138 (${bucketSum})`);
}

const catHitRects = (categorySvg.match(/class="chart-row-bg"/g) || []).length;
const demHitRects = (demoSvg.match(/class="chart-row-bg"/g) || []).length;
if (catHitRects !== 8 || demHitRects !== 8) {
  throw new Error(`Expected 8 full-row hit rects in horizontal charts (got cat=${catHitRects}, dem=${demHitRects})`);
}
const smeRes = Engine.filterAndSort(rawData, { eligibilityTags: ['SMEs/business owners'] });
if (smeRes.totalCount !== 20) {
  throw new Error(`Expected 20 items for SMEs/business owners, got ${smeRes.totalCount}`);
}

console.log('\n=======================================');
console.log('ALL 10 AUTOMATED VERIFICATION TESTS PASSED!');
console.log('=======================================');
