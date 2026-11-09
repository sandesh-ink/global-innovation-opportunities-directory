# GLOBAL INNOVATION OPPORTUNITIES DIRECTORY 2026/2027

A complete, database-driven, responsive, searchable, sortable, and filterable web application constructed from the **2026/2027 Master Directory of Global & Regional Opportunities**, originally compiled and published by **Abdulsamad ([@richtosho](https://x.com/richtosho))** on X / Twitter.

---

## 📋 Executive Overview & Data Accounting

- **Data Originator & Compiler**: Abdulsamad — **Twitter/X**: [@richtosho](https://x.com/richtosho)
- **Authoritative Source Document**: `2026_2027 Global and Regional Opportunities Directory .pdf` (23 pages)
- **Total Opportunities Extracted**: **138** numbered programs across all **23 pages**
- **Duplicate Records**: **0** (strictly validated 1 to 138)
- **Host Continents & Regions Covered**: **7** (Africa, Americas, Asia, Europe, Global, Middle East, Oceania)
- **Deadlines Breakdown**:
  - Explicit Dated Deadlines: **72**
  - Rolling & Continuous Intakes: **29**
  - Cohort / Portal / Recurring Windows: **37**
  - Past listed deadlines relative to current date: **40** (labeled with caution notice: `Listed deadline passed — verify with provider`)
- **License / Terms**: Original compilation marked **NOT FOR SALE** by Abdulsamad (`@richtosho`).

---

## 🌟 Key Application Capabilities

### 1. ⚡ Live Full-Text Search
- Instant, case-insensitive keyword search across **Opportunity Name**, **Host Continent/Region**, **Eligibility Criteria**, **Key Benefits and Rewards**, **Required Documents**, and **Application Deadline**.
- Real-time keyword highlighting (`<mark class="search-highlight">`) in result cards and table views.
- Keyboard shortcut: Press `/` anywhere on the page to focus the search bar immediately; press `Esc` to clear search or close dialogs.
- Clear button and active search term chips with instant result counters.

### 2. 🎯 Multi-Faceted Filter Matrix
- **Host Region Filter**: Africa, Global, Europe, Asia, Americas, Middle East, Oceania, and multi-region hubs.
- **Opportunity Category Filter** (multi-category tagging):
  - Scholarships, Grants, Fellowships, Internships, Accelerators, Incubators, Competitions, Training, Mentorship, Business Support, Research, Other.
- **Deadline Type Filter**:
  - Specific date, Rolling, Continuous intake, Varies by cohort, Check portal, Quarterly, Annual or recurring, Other/unspecified.
- **Target Audience / Eligibility Filter**:
  - Students, Graduates, Young professionals, Entrepreneurs, Startups, Women, Researchers, NGOs, SMEs/business owners, Other.
- **Hide Passed Deadlines Toggle**: Allows users to filter out historical dates while preserving active and rolling intakes.
- **Saved / Shortlist Filter**: Filter by starred opportunities.
- **Active Filter Chips**: Interactive chips displaying every active constraint with individual remove buttons and a master **Clear All Filters** trigger.

### 3. ⏱️ Live Deadline Status Badges (Calculated from Today's Date)
- **Dynamic Date Comparison**: Every opportunity's deadline is evaluated in real time against today's date (`new Date()`).
- **Closes Today!**: Pulsating rose badge (`badge-rose`) alerting users to final-day submissions.
- **Closes Tomorrow (1d left)**: Orange alert badge (`badge-orange`) for 24-hour remaining windows.
- **Closing Soon (2–7 days left)**: Highlighting impending cutoffs within the next 7 days.
- **Open (X days left)**: Emerald active badge (`badge-emerald`) displaying remaining days (and months for long-term calls).
- **Active: Rolling Intake**: Emerald intake badge for continuous pipelines.
- **Cohort / Quarterly / Annual Intake**: Teal recurring badges (`badge-teal`) for structured cohort and quarterly review cycles.
- **Passed (X days ago)**: Amber caution badge (`badge-amber`) flagging past deadlines with exact elapsed days and guidance to verify current status with the provider.
- **Dual Presentation**: Displays the live calculated status badge alongside the exact printed deadline string from the PDF source document.

### 4. 🔄 Deterministic Multi-Field Sorting
- **Opportunity Name**: Alphabetical (A–Z) and Reverse (Z–A)
- **Application Deadline**:
  - **Earliest First**: Dated deadlines strictly ordered chronologically, followed by rolling/open deadlines.
  - **Latest First**: Dated deadlines sorted latest to earliest, followed by rolling/open deadlines.
  - **No artificial dates** are assigned to non-date deadlines.
- **Host Region**: Alphabetical continent/region sort.
- **Opportunity Category**: Alphabetical primary category sort.

### 5. 🎛️ Dual View Modes (Cards vs. Data Table)
- **Editorial Cards View**: Modern card layout featuring category chips, host region badges, PDF page citations, standout reward callouts, eligibility previews, live calculated deadline-status badges, and direct actions.
- **Professional Data Table View**: Dense, high-efficiency data table with clickable sortable headers (`Opportunity Name`, `Deadline`), category tags, and action buttons.

### 6. 📋 Comprehensive Opportunity Detail Drawer / Modal
- Detailed view accessible by clicking any card or table row:
  - Full opportunity name, PDF serial number (#1–#138), and PDF source page citation (Page 1–23).
  - Standout **Key Benefits & Rewards** callout box.
  - Complete **Eligibility Criteria**.
  - Program Classifications & Derived Target Profile tags.
  - **Interactive Required Documents Checklist**: Lets applicants tick off prepared documents (e.g., `Pitch Deck`, `CAC Registration`, `Transcripts`, `CV`) with real-time completion progress tracking saved to `localStorage`.
  - Application Deadline and Data Quality Notes (e.g. OCR line joins, multi-page continuation details).
  - **Apply Now** button opening verified URL in a new tab (`target="_blank" rel="noopener noreferrer"`).
  - 1-click **Copy Link** button with toast feedback.
  - Sequential **Previous** / **Next** opportunity navigation (supports `←` and `→` keyboard arrows).

### 6. 💾 Bookmarks & Local Storage
- Star / bookmark any opportunity to persist a personal shortlist in `localStorage`.
- Live counter pill in the toolbar (`⭐ Saved (N)`).

### 7. 📥 RFC 4180 CSV Export
- One-click **Export Filtered CSV** button that generates an RFC 4180-compliant `.csv` file representing the current search and filter results.
- Includes ID, Name, Region, Categories, Eligibility, Benefits, Required Documents, Deadline, Normalized Date, Deadline Type, Status, URL, PDF Page, and Data Quality Notes.

### 8. 🔗 State Synchronization via Shareable URLs
- State changes (search query, selected filters, sort mode, page number, view mode) automatically serialize to the URL query string (`window.history.replaceState`).
- Direct sharing or reloading of URLs preserves the exact filtered view.

---

## 🗂️ Data Schema Specification

Every opportunity record in `data/opportunities.json` adheres to the following specification:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `integer` | Serial number from PDF table (1 to 138) |
| `opportunity_name` | `string` | Official name of program / challenge / fellowship |
| `continent_or_region` | `string` | Host continent / geographical scope as printed in PDF |
| `eligibility_criteria` | `string` | Full eligibility criteria without modification |
| `key_benefits_and_rewards` | `string` | Full financial award, stipend, or scaling support |
| `required_documents` | `string` | Comma-separated list of required application documents |
| `required_documents_list` | `array[string]` | Cleaned list of documents for interactive checklist |
| `application_deadline` | `string` | Original deadline string as printed in PDF |
| `application_url` | `string` | Repaired and verified full URL |
| `deadline_date` | `string \| null` | Normalized ISO date (`YYYY-MM-DD`) only when unambiguous |
| `deadline_type` | `string` | Standardized enum: `Specific date`, `Rolling`, `Continuous intake`, `Varies by cohort`, `Check portal`, `Quarterly`, `Annual or recurring`, `Other/unspecified` |
| `is_past_deadline` | `boolean` | Flagged `true` if explicit deadline is prior to current date |
| `deadline_status_label` | `string` | Status label: e.g. `Listed deadline passed — verify with provider` |
| `source_page` | `integer` | Page number in original PDF (1 to 23) |
| `data_quality_notes` | `string` | Notes on multi-page row joins or scheduling context |
| `categories` | `array[string]` | Derived categories (Scholarships, Grants, Accelerators, etc.) |
| `eligibility_tags` | `array[string]` | Derived profile tags (Students, Women, Startups, etc.) |
| `region_tags` | `array[string]` | Standardized regions (Africa, Americas, Asia, Europe, Global, Middle East, Oceania) |

---

## 🏗️ Architecture & File Structure

```
opportunities-directory/
├── index.html                   # Semantic HTML5 dashboard interface
├── css/
│   └── app.css                  # Editorial aesthetic, typography, card & modal styles
├── js/
│   ├── engine.js                # Core data engine: search, multi-filter, sorting, CSV & URL state
│   ├── opportunities_data.js    # Embedded dataset (window.MASTER_OPPORTUNITIES_DATA)
│   └── ui.js                    # UI controller, event delegation, modal drawer, checklists
├── data/
│   └── opportunities.json       # Canonical structured JSON dataset (138 records)
├── build_master_dataset.py      # Automated data extraction & normalization script
├── test_suite.js                # Automated verification test suite (7 comprehensive test cases)
└── README.md                    # Documentation & operational guide
```

---

## 🚀 How to Run the Website

### Option 1: View in Browser Directly
Open `index.html` in any modern web browser:
```bash
open /Users/sandeshreddy/.gemini/antigravity/scratch/opportunities-directory/index.html
```

### Option 2: Run with Local HTTP Server
```bash
cd /Users/sandeshreddy/.gemini/antigravity/scratch/opportunities-directory
python3 -m http.server 8080
```
Then visit: **[http://localhost:8080](http://localhost:8080)**

---

## 🧪 Automated Test Suite Results

Run the verification suite at any time:
```bash
node test_suite.js
```

**Verification Results**:
- `Total Count & Uniqueness`: 138 entries, IDs 1 to 138, 0 duplicates.
- `Field Completeness`: 100% of records have valid names, regions, eligibility, benefits, documents, deadlines, URLs, and source page ranges (1–23).
- `Search Accuracy`: Live multi-token search verified across all key fields.
- `Multi-Filter Matrix`: Verified combination of regions, categories, deadlines, and profiles.
- `Sorting Reliability`: Verified alphabetical name, chronological deadline, region, and category order.
- `CSV Export`: Verified RFC 4180 compliance with matching record counts and headers.
- `URL State Serialization`: Verified bidirectional query string sync.
- `Live Deadline Status Calculation`: Verified real-time relative calculation from today's date across all 138 programs.
