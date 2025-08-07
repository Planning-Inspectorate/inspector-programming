import { describe, test } from 'node:test';
import assert from 'node:assert';
import { formatDateForDisplay } from './date.js';

describe('date', () => {
	describe('formatDateForDisplay', () => {
		const tests = [
			{ date: new Date('2024-02-20T15:00:00.000Z'), expected: '20 Feb 2024 - 15 00' },
			{ date: new Date('2024-09-30T20:00:00.000Z'), expected: '30 Sep 2024 - 21 00' },
			{ date: new Date('2024-09-30T23:59:59.000Z'), expected: '1 Oct 2024 - 00 59' },
			{ date: '2024-02-20T15:00:00.000Z', expected: '20 Feb 2024 - 15 00' },
			{ date: '2024-09-30T20:00:00.000Z', expected: '30 Sep 2024 - 21 00' },
			{ date: '2024-09-30T23:59:00.000Z', expected: '1 Oct 2024 - 00 59' }
		];

		for (const { date, expected } of tests) {
			test(`formats ${date} in Europe/London`, () => {
				const got = formatDateForDisplay(date, { format: 'd MMM yyyy - HH mm' });
				assert.strictEqual(got, expected);
			});
		}

		const badInputTests = [
			{ date: undefined, expected: '' },
			{ date: null, expected: '' },
			{ date: 'nope', expected: '' }
		];

		for (const { date, expected } of badInputTests) {
			test(`returns empty string for bad value: ${date}`, () => {
				const got = formatDateForDisplay(date);
				assert.strictEqual(got, expected);
			});
		}
	});
});
