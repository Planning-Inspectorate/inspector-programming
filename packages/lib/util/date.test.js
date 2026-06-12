import { describe, test } from 'node:test';
import assert from 'node:assert';
import { formatDateForDisplay, getPreviousWeekRange } from './date.js';

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

	describe('getPreviousWeekRange', () => {
		test('returns previous week when called on a Friday', () => {
			// June 12, 2026 is a Friday
			const referenceDate = new Date('2026-06-12T12:00:00.000Z');
			const { weekStart, weekEnd } = getPreviousWeekRange(referenceDate);

			// Midnight Monday 1st June
			assert.strictEqual(weekStart.toISOString(), new Date('2026-05-31T23:00:00.000Z').toISOString());
			// Midnight Sunday 7th June
			assert.strictEqual(weekEnd.toISOString(), new Date('2026-06-07T22:59:59.999Z').toISOString());
		});

		test('returns previous week when called on a Monday', () => {
			// June 8, 2026 is a Monday
			const referenceDate = new Date('2026-06-08T12:00:00.000Z');
			const { weekStart, weekEnd } = getPreviousWeekRange(referenceDate);

			// Midnight Monday 1st June
			assert.strictEqual(weekStart.toISOString(), new Date('2026-05-31T23:00:00.000Z').toISOString());
			// Midnight Sunday 7th June
			assert.strictEqual(weekEnd.toISOString(), new Date('2026-06-07T22:59:59.999Z').toISOString());
		});

		test('returns previous week when called on a Sunday', () => {
			// June 7, 2026 is a Sunday
			const referenceDate = new Date('2026-06-07T12:00:00.000Z');
			const { weekStart, weekEnd } = getPreviousWeekRange(referenceDate);

			assert.strictEqual(weekStart.toISOString(), new Date('2026-05-24T23:00:00.000Z').toISOString());
			assert.strictEqual(weekEnd.toISOString(), new Date('2026-05-31T22:59:59.999Z').toISOString());
		});

		test('returns valid range for default parameter (current date)', (ctx) => {
			ctx.mock.timers.enable({
				apis: ['Date'],
				now: new Date('2026-02-09T09:00:00Z')
			});
			const { weekStart, weekEnd } = getPreviousWeekRange();

			assert.strictEqual(weekStart.toISOString(), new Date('2026-02-02T00:00:00.000Z').toISOString());
			assert.strictEqual(weekEnd.toISOString(), new Date('2026-02-08T23:59:59.999Z').toISOString());
		});
	});
});
