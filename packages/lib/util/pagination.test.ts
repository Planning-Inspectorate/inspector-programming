import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPageNumber } from './pagination.ts';

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
