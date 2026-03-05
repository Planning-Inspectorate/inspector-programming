import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { getPageNumber, paginateList } from './pagination.ts';

describe('determinePage', () => {
	it('should return requested page if valid', () => {
		const requestedPage = 3;
		const totalPages = 5;
		const page = getPageNumber(requestedPage, totalPages);
		assert.strictEqual(page, requestedPage);
	});
	it('should return the maximum page if requested page exceeds maximum', () => {
		const requestedPage = 7;
		const totalPages = 5;
		const page = getPageNumber(requestedPage, totalPages);
		assert.strictEqual(page, totalPages);
	});
	it('should return page 1 if the requested page is not a valid number', () => {
		const requestedPage = 'seven';
		const totalPages = 5;
		// @ts-expect-error
		const page = getPageNumber(requestedPage, totalPages);
		assert.strictEqual(page, 1);
	});
});

describe('paginateList', () => {
	const fiveItems = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];

	it('should handle an empty array of cases elegantly', () => {
		const emptyPage = paginateList([], 1, 3);
		assert.deepStrictEqual(emptyPage, { list: [], total: 0 });
	});
	it('should return a number of cases determined by the pageSize', () => {
		const three = paginateList(fiveItems, 1, 3);
		const four = paginateList(fiveItems, 1, 4);
		const five = paginateList(fiveItems, 1, 5);
		assert.deepStrictEqual(three.list, ['item-1', 'item-2', 'item-3']);
		assert.deepStrictEqual(four.list, ['item-1', 'item-2', 'item-3', 'item-4']);
		assert.deepStrictEqual(five.list, ['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
		assert.deepStrictEqual(three.total, 5);
		assert.deepStrictEqual(four.total, 5);
		assert.deepStrictEqual(five.total, 5);
	});
	it('should offset the pages retrieved using page', () => {
		const pageTwo = paginateList(fiveItems, 2, 2);
		assert.deepStrictEqual(pageTwo.list, ['item-3', 'item-4']);
		assert.deepStrictEqual(pageTwo.total, 5);
	});
	it('should handle fewer cases than page size elegantly', () => {
		const overflowPageTwo = paginateList(fiveItems, 2, 3);
		assert.deepStrictEqual(overflowPageTwo.list, ['item-4', 'item-5']);
		assert.deepStrictEqual(overflowPageTwo.total, 5);
	});
});
