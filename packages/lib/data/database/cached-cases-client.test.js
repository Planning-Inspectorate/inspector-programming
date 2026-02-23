import { describe, it, mock } from 'node:test';
import { buildInitCasesClient, CachedCasesClient } from './cached-cases-client.js';
import assert from 'node:assert';
import { APPEAL_CASE_STATUS } from '@planning-inspectorate/data-model';

describe('cached-cases-client', () => {
	describe('buildInitCasesClient', () => {
		const mockClient = {};
		const mockCache = {
			get: mock.fn(() => [1, 2, 3])
		};

		it('should return a CachedCasesClient', () => {
			const initEntraClient = buildInitCasesClient(mockClient, mockCache);
			assert.strictEqual(initEntraClient instanceof CachedCasesClient, true);
		});
	});
	describe('CachedCasesClient', () => {
		it('should return cached entry if present', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [1, 2, 3])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(cases, [1, 2, 3]);
		});
		it('should fetch new value if no cache value', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn(),
				getAllCases: mock.fn(() => [3, 4, 5])
			};
			const mockCache = {
				get: mock.fn(),
				set: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const cases = await cacheClient.getAllCases();
			assert.deepStrictEqual(cases, [3, 4, 5]);
			assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.strictEqual(mockCache.set.mock.callCount(), 1);
		});

		it('should return case by case id', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const appeal = await cacheClient.getCaseById(2);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(appeal, { caseId: 2 });
		});

		it('should return cases by case ids', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const appeals = await cacheClient.getCasesByIds([2]);
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(appeals, [{ caseId: 2 }]);
		});

		it('should return linked cases by lead case reference', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [
					{ id: '1', leadCaseReference: 'A' },
					{ id: '2', leadCaseReference: 'B' },
					{ id: '3', leadCaseReference: 'A' }
				])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const linkedCases = await cacheClient.getLinkedCasesByParentCaseId('A');
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(linkedCases, [
				{ id: '1', leadCaseReference: 'A' },
				{ id: '3', leadCaseReference: 'A' }
			]);
		});

		it('should get all cases that are parent or stand alone cases', async () => {
			const mockClient = {
				lastCasesUpdate: mock.fn()
			};
			const mockCache = {
				get: mock.fn(() => [
					{ id: '1', linkedCaseStatus: 'Child' },
					{ id: '2', linkedCaseStatus: 'Parent' },
					{ id: '3', linkedCaseStatus: '' }
				])
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			const linkedCases = await cacheClient.getAllParentCases();
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(linkedCases, [
				{ id: '2', linkedCaseStatus: 'Parent' },
				{ id: '3', linkedCaseStatus: '' }
			]);
		});

		it('should remove cases from cache', async () => {
			const mockClient = { deleteCases: mock.fn() };
			const mockCache = {
				get: mock.fn(() => [{ caseId: 1 }, { caseId: 2 }, { caseId: 3 }]),
				set: mock.fn()
			};
			const cacheClient = new CachedCasesClient(mockClient, mockCache);
			await cacheClient.deleteCases([1, 3]);
			assert.deepStrictEqual(mockCache.set.mock.calls[0].arguments[1], [{ caseId: 2 }]);
		});

		describe('getCases', () => {
			const makeCase = ({
				caseId,
				caseAge = 0,
				caseReceivedDate = null,
				lpaName = null,
				lat = null,
				lng = null,
				caseStatus = APPEAL_CASE_STATUS.READY_TO_START
			}) => ({
				caseId,
				caseAge,
				caseReceivedDate,
				lpaName,
				siteAddressLatitude: lat,
				siteAddressLongitude: lng,
				caseStatus
			});

			const newMockClient = () => {
				return {
					paginateCases: mock.fn((cases, page, pageSize) => {
						const start = (page - 1) * pageSize;
						return { cases: cases.slice(start, start + pageSize), total: cases.length };
					}),
					lastCasesUpdate: mock.fn()
				};
			};

			it('should get only parent cases from getAllParentCases', async () => {
				const mockClient = newMockClient();
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const allCases = [
					{ caseId: 1, linkedCaseStatus: 'Child' },
					{ caseId: 2, linkedCaseStatus: 'Parent' },
					{ caseId: 3, linkedCaseStatus: '' }
				];

				cacheClient.getAllCases = mock.fn(() => Promise.resolve(allCases));

				const parents = await cacheClient.getAllParentCases();
				assert.deepStrictEqual(parents, [
					{ caseId: 2, linkedCaseStatus: 'Parent' },
					{ caseId: 3, linkedCaseStatus: '' }
				]);
			});

			it('should excludes cases with invalid statuses', async () => {
				const mockClient = newMockClient();
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const allCases = [
					makeCase({ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER }),
					makeCase({ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION }),
					makeCase({ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START })
				];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({}, undefined, 1, 10);

				assert.strictEqual(mockClient.paginateCases.mock.callCount(), 1);
				const passedCases = mockClient.paginateCases.mock.calls[0].arguments[0];
				assert.deepStrictEqual(
					passedCases.map((c) => c.caseId),
					[3]
				);

				assert.strictEqual(result.total, 1);
				assert.strictEqual(result.page, 1);
				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[3]
				);
			});

			it('should sorts by age (default) and paginates results', async () => {
				const mockClient = newMockClient();
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const allCases = [
					makeCase({ caseId: 1, caseAge: 5 }),
					makeCase({ caseId: 2, caseAge: 1 }),
					makeCase({ caseId: 3, caseAge: 3 })
				];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const pageSize = 2;
				const result = await cacheClient.getCases({}, undefined, 1, pageSize);

				assert.strictEqual(mockClient.paginateCases.mock.callCount(), 1);

				const passedCases = mockClient.paginateCases.mock.calls[0].arguments[0];
				assert.deepStrictEqual(
					passedCases.map((c) => c.caseId),
					[1, 3, 2]
				);

				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[1, 3]
				);
				assert.strictEqual(result.total, 3);
				assert.strictEqual(result.page, 1);
			});

			it('should sorts by distance when requested', async () => {
				const mockClient = newMockClient();
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const inspectorCoords = { lat: 0.01, lng: 0.01 };
				const allCases = [makeCase({ caseId: 1, lat: 0.01, lng: 0.21 }), makeCase({ caseId: 2, lat: 0.01, lng: 0.11 })];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({ inspectorCoordinates: inspectorCoords }, 'distance', 1, 10);

				assert.strictEqual(mockClient.paginateCases.mock.callCount(), 1);

				const passedCases = mockClient.paginateCases.mock.calls[0].arguments[0];
				assert.deepStrictEqual(
					passedCases.map((c) => c.caseId),
					[2, 1]
				);

				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[2, 1]
				);
				assert.strictEqual(result.total, 2);
				assert.strictEqual(result.page, 1);
			});

			it('should filters out cases within 5km of inspector and handles page bounds', async () => {
				const mockClient = newMockClient();
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const inspectorCoords = { lat: 0.01, lng: 0.01 };
				const nearCase = makeCase({ caseId: 1, lat: 0.01, lng: 0.015 });
				const farCase = makeCase({ caseId: 2, lat: 0.01, lng: 0.11 });
				const allCases = [nearCase, farCase];

				cacheClient.getAllParentCases = mock.fn(() => Promise.resolve(allCases));

				const result = await cacheClient.getCases({ inspectorCoordinates: inspectorCoords }, 'distance', 5, 1);

				assert.strictEqual(mockClient.paginateCases.mock.callCount(), 1);
				const passedCases = mockClient.paginateCases.mock.calls[0].arguments[0];
				assert.deepStrictEqual(
					passedCases.map((c) => c.caseId),
					[2]
				);

				assert.strictEqual(result.page, 1);
				assert.strictEqual(result.total, 1);
				assert.deepStrictEqual(
					result.cases.map((c) => c.caseId),
					[2]
				);
			});
		});

		describe('getValidatedCases', () => {
			it('should return all cases when none are excluded', () => {
				const mockClient = {};
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const inputCases = [
					{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.READY_TO_START },
					{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.LPA_QUESTIONNAIRE }
				];

				const results = cacheClient.getValidatedCases(inputCases);

				assert.deepStrictEqual(results, inputCases);
			});

			it('should filter out excluded statuses', () => {
				const mockClient = {};
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const inputCases = [
					{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
					{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION },
					{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }
				];

				const results = cacheClient.getValidatedCases(inputCases);

				assert.deepStrictEqual(results, [{ caseId: 3, caseStatus: APPEAL_CASE_STATUS.READY_TO_START }]);
			});

			it('should return empty array when all cases are excluded', () => {
				const mockClient = {};
				const mockCache = {};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);

				const inputCases = [
					{ caseId: 1, caseStatus: APPEAL_CASE_STATUS.ASSIGN_CASE_OFFICER },
					{ caseId: 2, caseStatus: APPEAL_CASE_STATUS.VALIDATION }
				];

				const results = cacheClient.getValidatedCases(inputCases);

				assert.deepStrictEqual(results, []);
			});
		});

		describe('use of cache', () => {
			const cacheTtl = 5 * 60 * 1000; // 5 minutes
			const newMockCache = () => {
				return {
					get: mock.fn(() => [1, 2, 3]),
					set: mock.fn(),
					get cacheTtlMs() {
						return cacheTtl;
					}
				};
			};
			describe('shouldTryCache', () => {
				it('should return true if no recent updates', async (ctx) => {
					const now = new Date('2025-01-30T00:00:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
					};
					const mockCache = newMockCache();
					const cacheClient = new CachedCasesClient(mockClient, mockCache);
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, true);
				});

				it('should fetch false if recent updates', async (ctx) => {
					const now = new Date('2025-01-30T00:05:00.000Z');
					ctx.mock.timers.enable({ apis: ['Date'], now });
					const mockClient = {
						lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:00:00.000Z'))
					};
					const mockCache = newMockCache();
					const cacheClient = new CachedCasesClient(mockClient, mockCache);
					const shouldTryCache = await cacheClient.shouldTryCache();
					assert.deepStrictEqual(shouldTryCache, false);
				});
			});
			it('should return cached entry if no recent updates', async (ctx) => {
				const now = new Date('2025-01-30T00:00:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					lastCasesUpdate: mock.fn(() => new Date('2025-01-29T00:00:00.000Z'))
				};
				const mockCache = newMockCache();
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const cases = await cacheClient.getAllCases();
				assert.strictEqual(mockCache.get.mock.callCount(), 1);
				assert.deepStrictEqual(cases, [1, 2, 3]);
			});

			it('should fetch new values if recent updates', async (ctx) => {
				const now = new Date('2025-01-30T00:05:00.000Z');
				ctx.mock.timers.enable({ apis: ['Date'], now });
				const mockClient = {
					lastCasesUpdate: mock.fn(() => new Date('2025-01-30T00:00:00.000Z')),
					getAllCases: mock.fn(() => [5, 6, 7])
				};
				const mockCache = newMockCache();
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const cases = await cacheClient.getAllCases();
				assert.strictEqual(mockCache.get.mock.callCount(), 0);
				assert.strictEqual(mockCache.set.mock.callCount(), 1);
				assert.strictEqual(mockClient.getAllCases.mock.callCount(), 1);
				assert.deepStrictEqual(cases, [5, 6, 7]);
			});
		});

		describe('determinePage', () => {
			it('should return requested page if valid', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 3;
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, requestedPage);
			});
			it('should return the maximum page if requested page exceeds maximum', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 7;
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, totalPages);
			});
			it('should return page 1 if the requested page is not a valid number', () => {
				const mockClient = { getAllCases: mock.fn(() => [3, 4, 5]) };
				const mockCache = {
					get: mock.fn(),
					set: mock.fn()
				};
				const cacheClient = new CachedCasesClient(mockClient, mockCache);
				const requestedPage = 'seven';
				const totalPages = 5;
				const page = cacheClient.determinePage(requestedPage, totalPages);
				assert.strictEqual(page, 1);
			});
		});
	});
});
