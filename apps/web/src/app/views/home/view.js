/* global accessibleAutocomplete document flatpickr window */

document.addEventListener('DOMContentLoaded', function () {
	// Retrieve our server data from the global configuration object
	const config = window.CaseListConfig || {};

	// Handle refresh button click to reload the page
	const refreshBtn = document.querySelector('#refresh-btn');
	refreshBtn.addEventListener('click', () => {
		refreshBtn.disabled = true;
		refreshBtn.setAttribute('aria-busy', 'true');
		window.location.reload();
	});

	const SELECTED_CASES_KEY = 'selectedCases';

	function updateSelectedRowStyle(checkbox) {
		const row = checkbox?.closest('tr');
		if (!row) {
			return;
		}
		row.classList.toggle('case-row-selected', checkbox.checked);
	}

	function getStoredSelectedCases() {
		try {
			return JSON.parse(sessionStorage.getItem(SELECTED_CASES_KEY) || '[]');
		} catch {
			return [];
		}
	}

	function setStoredSelectedCases(ids) {
		try {
			sessionStorage.setItem(SELECTED_CASES_KEY, JSON.stringify(ids));
		} catch {
			// Intentionally ignored - sessionStorage may not be available
		}
	}

	// Clear selected cases when navigating to the home page
	let homeLinks = document.querySelectorAll('.pins-service-navigation a[href="/"]');
	homeLinks.forEach(function (link) {
		link.addEventListener('click', function () {
			try {
				sessionStorage.removeItem('selectedCases');
			} catch {
				// Intentionally ignored - sessionStorage may not be available
			}
		});
	});

	// Clear stored selections after a successful assignment
	if (config.hasSuccessSummary) {
		sessionStorage.removeItem(SELECTED_CASES_KEY);
	}

	// Cache DOM elements on load
	const tableBody = document.querySelector('.home-cases-table tbody');
	const checkboxes = tableBody
		? Array.from(tableBody.querySelectorAll('input[type="checkbox"][name="selectedCases"]'))
		: [];

	/**
	 * Stores the original index of each case row in the table.
	 * Maps caseId -> caseIDToRowIndex.
	 * @type {Map<string, number>}
	 */
	const caseIDToRowIndex = new Map();

	/**
	 * Maps caseId -> checkbox element for quick lookup
	 * @type {Map<string, HTMLInputElement>}
	 */
	const caseIdToCheckbox = new Map();

	checkboxes.forEach((cb, index) => {
		caseIDToRowIndex.set(cb.value, index);
		caseIdToCheckbox.set(cb.value, cb);
	});

	// Reorders table rows so checked ones appear first, preserving original order for unchecked rows.
	function syncSelectedCaseRows() {
		if (!tableBody) {
			return;
		}

		const selectedRows = [];
		const unselectedRows = [];

		for (const checkbox of checkboxes) {
			const row = checkbox.closest('tr');
			if (!row) {
				continue;
			}
			if (checkbox.checked) {
				selectedRows.push(row);
			} else {
				// Cache the original index so the sort comparator avoids repeated DOM/Map lookups.
				unselectedRows.push({ row, order: caseIDToRowIndex.get(checkbox.value) });
			}
		}

		// Sort unselected rows back into their original page order.
		unselectedRows.sort((a, b) => a.order - b.order);

		// Batch the reordering into a single reflow
		const fragment = document.createDocumentFragment();
		for (const row of selectedRows) {
			fragment.appendChild(row);
		}
		for (const { row } of unselectedRows) {
			fragment.appendChild(row);
		}
		tableBody.appendChild(fragment);
	}

	// Restore checkbox state from sessionStorage on page load
	const storedSelected = getStoredSelectedCases();
	checkboxes.forEach((checkbox) => {
		if (storedSelected.includes(checkbox.value)) {
			checkbox.checked = true;
		}
		updateSelectedRowStyle(checkbox);
	});

	syncSelectedCaseRows();

	checkboxes.forEach((checkbox) => {
		checkbox.addEventListener('change', function () {
			console.debug('case checkbox value changed:', checkbox.value, checkbox.checked);
			document.dispatchEvent(
				new CustomEvent('caseStateChange', {
					detail: {
						caseId: checkbox.value,
						selected: checkbox.checked
					}
				})
			);
		});
	});

	document.addEventListener('caseStateChange', function (event) {
		const { caseId, selected } = event.detail;
		console.debug('caseStateChange, syncing checkbox state', caseId, selected);

		const checkbox = caseIdToCheckbox.get(String(caseId));
		if (!checkbox) {
			return;
		}

		checkbox.checked = selected;
		updateSelectedRowStyle(checkbox);

		// Keep selected rows grouped at the top when a case is deselected.
		// In case lists, we regroup only on deselect — selecting a case doesn’t reorder the list,
		// as the product decision is to avoid shifting rows on selection.
		if (!selected) {
			syncSelectedCaseRows();
		}

		// Persist selection state to sessionStorage
		let stored = getStoredSelectedCases();
		if (selected && !stored.includes(String(caseId))) {
			stored.push(String(caseId));
		} else if (!selected) {
			stored = stored.filter((id) => id !== String(caseId));
		}
		setStoredSelectedCases(stored);
	});

	document.addEventListener('mapSelectionError', function (event) {
		const { message } = event.detail;
		console.debug('mapSelectionError:', message);
		showMapError(message);
	});

	function showMapError(message) {
		// Remove any existing error
		const existingError = document.getElementById('mapError');
		if (existingError) {
			existingError.remove();
		}
		const errorDiv = document.createElement('div');
		errorDiv.id = 'mapError';
		errorDiv.className = 'govuk-error-message';
		errorDiv.setAttribute('role', 'alert');
		errorDiv.innerHTML = `
                <span class="govuk-visually-hidden">Error:</span>
                ${message}
            `;

		// Insert error at the top of the map view
		const mapTab = document.getElementById('mapView');
		if (mapTab) {
			mapTab.insertBefore(errorDiv, mapTab.firstChild);

			// Auto-remove the error after 5 seconds
			setTimeout(() => {
				if (errorDiv && errorDiv.parentNode) {
					errorDiv.remove();
				}
			}, 5000);
		}
	}

	document.querySelectorAll('.sort-pagination-link').forEach((link) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();

			const sortPaginationForm = document.getElementById('sort-pagination-form');
			const filterForm = document.getElementById('filter-form');
			if (!sortPaginationForm || !filterForm) return;

			if (e.target?.dataset?.sort) {
				const sortInput = sortPaginationForm.querySelector('input[name="sort"]');
				//don't reload page if no change
				if (sortInput.value === e.target?.dataset?.sort) return;
				sortInput.value = e.target?.dataset?.sort || '';
			} else if (e.target?.dataset?.limit) {
				const limitInput = sortPaginationForm.querySelector('input[name="limit"]');
				//don't reload page if no change
				if (limitInput.value === e.target?.dataset?.limit) return;
				limitInput.value = e.target?.dataset?.limit || '';
			}

			sortPaginationForm.submit();
		});
	});

	const inspectorForm = document.querySelector('#inspector-form');

	inspectorForm.addEventListener('submit', (e) => {
		e.preventDefault();

		const outlookTabSelected = document.querySelector('#tab_outlookView').getAttribute('aria-selected');
		const inspectorTabSelected = document.querySelector('#tab_inspector').getAttribute('aria-selected');
		let currentTab = document.getElementById('currentTab');

		if (outlookTabSelected === 'true') {
			currentTab.value = 'calendar';
		} else if (inspectorTabSelected === 'true') {
			currentTab.value = 'inspector';
		} else {
			currentTab.value = '';
		}

		const autocompleteInputText = document.querySelector('#inspectors');
		const autocompleteInputValue = document.querySelector('#inspectors-select');

		if (autocompleteInputText.value === '') {
			autocompleteInputValue.value = null;
		}

		inspectorForm.submit();
	});

	const inspectorsInput = document.querySelector('#inspectors');
	function registerNoInspectorError(tabId, showTab) {
		const tab = document.querySelector(tabId);
		if (!tab) return;
		tab.addEventListener('click', (e) => {
			if (inspectorsInput.value) {
				// do nothing if an inspector is selected already
				return;
			}
			// show 'no inspector' error if choosing a tab which requires an inspector to be selected
			// do this by submitting the 'select inspector' form
			e.preventDefault();
			const currentTab = document.getElementById('currentTab');
			currentTab.value = showTab;
			inspectorForm.submit();
		});
	}
	// Add event listener to each tab to submit select inspector form
	// this shows an error if no inspector is selected
	registerNoInspectorError('#tab_outlookView', 'calendar');
	registerNoInspectorError('#tab_inspector', 'inspector');

	// Sync the selected rows to the top when the user navigates back to the Cases tab
	const casesTab = document.querySelector('#tab_cases');
	if (casesTab) {
		casesTab.addEventListener('click', () => {
			syncSelectedCaseRows();
		});
	}

	// configure accessible auto complete for the select inspector input
	if (typeof accessibleAutocomplete !== 'undefined') {
		accessibleAutocomplete.enhanceSelectElement({
			selectElement: document.querySelector('#inspectors'),
			autoselect: false,
			confirmOnBlur: false,
			showAllValues: true,
			displayMenu: 'overlay'
		});
	}

	// configure the data picker for assignment date
	/**
	 * @type {string[]}
	 */
	const nonWorkingDays = Array.isArray(config.bankHolidays) ? config.bankHolidays : [];

	flatpickr('#assignment-date', {
		enableTime: false,
		minDate: config.assignmentDateMin || null,
		disable: [
			// this disables all weekends
			function (date) {
				return date.getDay() === 0 || date.getDay() === 6;
			},
			...nonWorkingDays
		],
		altInput: true,
		altFormat: 'd/m/Y',
		dateFormat: 'Y-m-d',
		defaultDate: config.assignmentDate || null,
		position: 'below right'
	});
});
