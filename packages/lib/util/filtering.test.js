import { describe, test } from 'node:test';
import assert from 'node:assert';
import { filterCases, validateFilters } from './filtering.js';

describe('filterCases', () => {
	test('should return all cases if no filters are applied', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
		const filters = {};
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(filteredCases.length, 3, 'Should return all cases when no filters are applied');
	});
	test('should filter cases by minimum age', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
		const filters = { minimumAge: 15 };
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(filteredCases.length, 2, 'Should return cases with age >= 15');
		assert.deepStrictEqual(filteredCases, [{ caseAge: 30 }, { caseAge: 20 }]);
	});
	test('should filter cases by maximum age', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
		const filters = { maximumAge: 20 };
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(filteredCases.length, 2, 'Should return cases with age <= 20');
		assert.deepStrictEqual(filteredCases, [{ caseAge: 10 }, { caseAge: 20 }]);
	});
	test('should filter cases by both minimum and maximum age', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
		const filters = { minimumAge: 15, maximumAge: 25 };
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(filteredCases.length, 1, 'Should return cases with age between 15 and 25');
		assert.deepStrictEqual(filteredCases, [{ caseAge: 20 }]);
	});
	test('invalid filter object should not apply filters', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }];
		const filters = 'invalid';
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(filteredCases.length, 3, 'Should return all cases when invalid filters applied');
	});
	test('basic age filtering should be applied even with no filtering applied', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }, { caseAge: -10 }, { caseAge: 1000 }];
		const filters = {};
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(
			filteredCases.length,
			3,
			'Should filter cases to be within given bounds even without provided filters'
		);
	});
	test('basic age filtering should be applied even with invalid filtering applied', () => {
		const cases = [{ caseAge: 30 }, { caseAge: 10 }, { caseAge: 20 }, { caseAge: -10 }, { caseAge: 1000 }];
		const filters = 42;
		const filteredCases = filterCases(cases, filters);
		assert.strictEqual(
			filteredCases.length,
			3,
			'Should filter cases to be within given bounds even without provided filters'
		);
	});
});
describe('validateFilters', () => {
	test('should return no errors if all filters are valid - age filters', () => {
		const filters = { minimumAge: 10, maximumAge: 30 };
		const errors = validateFilters(filters);
		assert.strictEqual(Object.keys(errors).length, 0, 'should return no errors if all filters are valid - age filters');
	});
	test('should return no errors for a valid minimumAge filters alone', () => {
		const filters = { minimumAge: 10 };
		const errors = validateFilters(filters);
		assert.strictEqual(Object.keys(errors).length, 0, 'should return no errors for a valid minimumAge filters alone');
	});
	test('should return an error if minimumAge is larger than maximumAge', () => {
		const filters = { minimumAge: 10, maximumAge: 5 };
		const errors = validateFilters(filters);
		assert.strictEqual(Object.keys(errors).length, 1, 'should return one error');
		assert.ok('minimumAge' in errors, "result should have an 'minimumAge' property");
		assert.strictEqual(
			errors.minimumAge.text,
			'The minimum value must be less than or equal to the maximum value.',
			'should return "The minimum value must be less than or equal to the maximum value." under minimumAge'
		);
		assert.strictEqual(errors.minimumAge.href, '#filters[minimumAge]', 'should return href to minimumAge field');
	});
	test('should return an error if an age filter is below 0', () => {
		const filters = { minimumAge: -1, maximumAge: 5 };
		const errors = validateFilters(filters);
		assert.strictEqual(Object.keys(errors).length, 1, 'should return one error');
		assert.ok('minimumAge' in errors, "result should have an 'minimumAge' property");
		assert.strictEqual(
			errors.minimumAge.text,
			'Please enter a number between 0 and 500',
			'should return "Please enter a number between 0 and 500" under minimumAge'
		);
		assert.strictEqual(errors.minimumAge.href, '#filters[minimumAge]', 'should return href to minimumAge field');
	});
	test('should return an error if an age filter is above 500', () => {
		const filters = { minimumAge: 10, maximumAge: 501 };
		const errors = validateFilters(filters);
		assert.strictEqual(Object.keys(errors).length, 1, 'should return one error');
		assert.ok('maximumAge' in errors, "result should have an 'maximumAge' property");
		assert.strictEqual(
			errors.maximumAge.text,
			'Please enter a number between 0 and 500',
			'should return "Please enter a number between 0 and 500" under maximumAge'
		);
		assert.strictEqual(errors.maximumAge.href, '#filters[maximumAge]', 'should return href to maximumAge field');
	});
});
