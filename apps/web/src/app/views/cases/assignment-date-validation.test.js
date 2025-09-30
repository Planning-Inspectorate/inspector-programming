import { describe, test } from 'node:test';
import assert from 'assert';
import { validateAssignmentDate } from './assignment-date-validation.js';

describe('validate Assignment Date', () => {
	test('returns error when empty', () => {
		const { error, date } = validateAssignmentDate('');
		assert.strictEqual(error, 'Select a valid date');
		assert.strictEqual(date, null);
	});

	test('rejects non-date characters', () => {
		const { error } = validateAssignmentDate('abc');
		assert.strictEqual(error, 'Select a valid date');
	});

	test('rejects symbol characters', () => {
		const { error } = validateAssignmentDate('!!/??/!!!!');
		assert.strictEqual(error, 'Select a valid date');
	});

	test('rejects mixed alphanumeric with symbols', () => {
		const { error } = validateAssignmentDate('2a/0@/2025');
		assert.strictEqual(error, 'Select a valid date');
	});

	test('rejects partly valid shape containing letters', () => {
		const { error } = validateAssignmentDate('29/AB/2025');
		assert.strictEqual(error, 'Select a valid date');
	});

	test('rejects past ISO date', () => {
		const { error } = validateAssignmentDate('2025-09-20');
		assert.strictEqual(error, 'Select a future date');
	});

	test('accepts today (ISO)', () => {
		const today = new Date();
		const formattedDate = today.toISOString().split('T')[0];
		const { error, date } = validateAssignmentDate(formattedDate);
		assert.strictEqual(error, null);
		assert.strictEqual(date, formattedDate);
	});

	test('accepts valid UK format date (DD/MM/YYYY) today', () => {
		const today = new Date();
		const pad = (n) => String(n).padStart(2, '0');
		const formattedDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
		const { error, date } = validateAssignmentDate(formattedDate);
		assert.strictEqual(error, null);
		assert.strictEqual(date, today.toISOString().split('T')[0]);
	});

	test('accepts future UK format date', () => {
		const { error, date } = validateAssignmentDate('01/10/2027');
		assert.strictEqual(error, null);
		assert.strictEqual(date, '2027-10-01');
	});

	test('rejects past UK date', () => {
		const { error } = validateAssignmentDate('20/09/2025');
		assert.strictEqual(error, 'Select a future date');
	});

	test('rejects impossible date (31/09/2025)', () => {
		const { error } = validateAssignmentDate('31/09/2025');
		assert.strictEqual(error, 'Select a valid date');
	});

	test('rejects explicit invalid date combos (ISO)', () => {
		for (const md of ['02-30', '02-31', '04-31', '06-31', '09-31', '11-31']) {
			const date = `2025-${md}`;
			const { error } = validateAssignmentDate(date);
			assert.strictEqual(error, 'Select a valid date', `Expected invalid for ${date}`);
		}
	});

	test('rejects explicit invalid UK day/month combos (DD/MM)', () => {
		for (const dm of ['30/02', '31/02', '31/04', '31/06', '31/09', '31/11']) {
			const date = `${dm}/2025`;
			const { error } = validateAssignmentDate(date);
			assert.strictEqual(error, 'Select a valid date', `Expected invalid for ${date}`);
		}
	});

	test('rejects non-leap-year 29 Feb (29/02/2025)', () => {
		const { error } = validateAssignmentDate('29/02/2025');
		assert.strictEqual(error, 'Select a valid date');
	});
});
