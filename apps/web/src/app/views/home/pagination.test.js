import { describe, test } from 'node:test';
import { buildQueryString, createPaginationItems, paginationValues, appendParam } from './pagination.js';
import assert from 'assert';

describe('pagination', () => {
	describe('paginationValues', () => {
		test('should return correct previous and next links and items', () => {
			const req = { query: { sort: 'age', page: 2 } };
			const total = 25;
			const formData = { page: 2, limit: 10 };
			const result = paginationValues(req, total, formData);

			assert.deepStrictEqual(result.previous, { href: '?sort=age&page=1' });
			assert.deepStrictEqual(result.next, { href: '?sort=age&page=3' });
			assert.strictEqual(result.items.length, 3);
			assert.strictEqual(result.items[1].current, true);
		});

		test('should handle first page correctly', () => {
			const req = { query: { sort: 'age', page: 1 } };
			const total = 15;
			const formData = { page: 1, limit: 10 };
			const result = paginationValues(req, total, formData);

			assert.strictEqual(result.previous, null);
			assert.deepStrictEqual(result.next, { href: '?sort=age&page=2' });
			assert.strictEqual(result.items.length, 2);
			assert.strictEqual(result.items[0].current, true);
		});

		test('should handle last page correctly', () => {
			const req = { query: { sort: 'age', page: 2 } };
			const total = 20;
			const formData = { page: 2, limit: 10 };
			const result = paginationValues(req, total, formData);

			assert.deepStrictEqual(result.previous, { href: '?sort=age&page=1' });
			assert.strictEqual(result.next, null);
			assert.strictEqual(result.items.length, 2);
			assert.strictEqual(result.items[1].current, true);
		});

		test('should always have at least one page', () => {
			const req = { query: {} };
			const total = 0;
			const formData = { page: 1, limit: 10 };
			const result = paginationValues(req, total, formData);

			assert.strictEqual(result.items.length, 1);
			assert.strictEqual(result.items[0].current, true);
		});
	});
	describe('buildQueryString', () => {
		test('should build query string with new page', () => {
			const params = { sort: 'age', page: 2 };
			const result = buildQueryString(params, 3);
			assert.strictEqual(result, '?sort=age&page=3');
		});

		test('should build query string from multiple query params with new page', () => {
			const params = { sort: 'age', maximumAge: 42, page: 2 };
			const result = buildQueryString(params, 3);
			assert.strictEqual(result, '?sort=age&maximumAge=42&page=3');
		});
		test('should omit undefined values', () => {
			const params = { sort: 'age', maximumAge: undefined };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&page=1');
		});
		test('should handle null values', () => {
			const params = { sort: 'age', maximumAge: null };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&page=1');
		});
		test('should handle empty string values', () => {
			const params = { sort: 'age', maximumAge: '' };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&maximumAge=&page=1');
		});

		test('should handle numeric values', () => {
			const params = { sort: 'age', maximumAge: 42 };
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?sort=age&maximumAge=42&page=1');
		});
		test('should handle empty params', () => {
			const params = {};
			const result = buildQueryString(params, 1);
			assert.strictEqual(result, '?page=1');
		});
	});
	describe('createPaginationItems', () => {
		const params = { sort: 'age' };
		test('should return all pages when totalPages <= 7', () => {
			const items = createPaginationItems(3, 5, params);
			assert.strictEqual(items.length, 5);
			assert.strictEqual(items[2].current, true);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[4].number, 5);
		});

		test('should add ellipsis for large page sets', () => {
			const items = createPaginationItems(10, 20, params);
			assert.strictEqual(items[0].number, 1);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 20);
			assert.ok(items.find((i) => i.current && i.number === 10));
		});

		test('should show correct pages near start', () => {
			const items = createPaginationItems(2, 10, params);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[1].number, 2);
			assert.ok(!items[1].ellipsis);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 10);
		});

		test('should show correct pages near end', () => {
			const items = createPaginationItems(9, 10, params);
			assert.strictEqual(items[0].number, 1);
			assert.ok(items.some((i) => i.ellipsis));
			assert.strictEqual(items[items.length - 1].number, 10);
			assert.ok(items.find((i) => i.current && i.number === 9));
		});

		test('should always have at least one page', () => {
			const items = createPaginationItems(1, 1, params);
			assert.strictEqual(items.length, 1);
			assert.strictEqual(items[0].number, 1);
			assert.strictEqual(items[0].current, true);
		});
	});
	describe('appendParam', () => {
		test('should append simple string value', () => {
			const sp = new URLSearchParams();
			appendParam(sp, 'sort', 'age');
			assert.strictEqual(sp.toString(), 'sort=age');
		});
		test('should append numeric value', () => {
			const sp = new URLSearchParams();
			appendParam(sp, 'page', 3);
			assert.strictEqual(sp.toString(), 'page=3');
		});
		test('should append empty string value', () => {
			const sp = new URLSearchParams();
			appendParam(sp, 'filter', '');
			assert.strictEqual(sp.toString(), 'filter=');
		});
		test('should append multiple values for array', () => {
			const sp = new URLSearchParams();
			appendParam(sp, 'tags', ['a', 'b']);
			assert.strictEqual(sp.toString(), 'tags=a&tags=b');
		});
		test('should skip undefined and null values', () => {
			const sp = new URLSearchParams();
			appendParam(sp, 'u', undefined);
			appendParam(sp, 'n', null);
			assert.strictEqual(sp.toString(), '');
		});
	});
});
