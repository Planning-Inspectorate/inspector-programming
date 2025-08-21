import { describe, test } from 'node:test';
import assert from 'assert';
import { getCaseColor, toCaseViewModel } from './view-model.js';

describe('view-model', () => {
	describe('toCaseViewModel', () => {
		test('should return a view model with formatted finalCommentsDate and color', () => {
			const caseData = {
				id: 1,
				caseAge: 30,
				finalCommentsDate: new Date('2025-08-06T23:00:00Z') // 7th August 2025 in Europe/London timezone
			};
			const viewModel = toCaseViewModel(caseData);
			assert.strictEqual(
				viewModel.finalCommentsDate,
				'07/08/2025',
				'Final comments date should be formatted in Europe/London timezone'
			);
			assert.strictEqual(viewModel.caseAgeColor, 'f47738', 'Color should be orange for case age 30');
		});
	});

	describe('getCaseColor', () => {
		test('should return red for case age greater than 40', () => {
			const color = getCaseColor(41);
			assert.strictEqual(color, 'd4351c', 'Color should be red for case age > 40');
		});
		test('should return orange for case age between 21 and 40', () => {
			const color = getCaseColor(30);
			assert.strictEqual(color, 'f47738', 'Color should be orange for case age between 21 and 40');
		});
		test('should return green for case age 20 or less', () => {
			const color = getCaseColor(20);
			assert.strictEqual(color, '00703c', 'Color should be green for case age <= 20');
		});
		test('should return green for case age 0', () => {
			const color = getCaseColor(0);
			assert.strictEqual(color, '00703c', 'Color should be green for case age = 0');
		});
	});
});
