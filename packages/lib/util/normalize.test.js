import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeString } from './normalize.js';

describe('normalizeString', () => {
	it('should trim leading and trailing whitespace and lowercase', () => {
		const input = '  Hello World  ';
		const result = normalizeString(input);
		assert.strictEqual(result, 'hello world');
	});
	it('should return already normalized string unchanged', () => {
		const input = 'test';
		const result = normalizeString(input);
		assert.strictEqual(result, 'test');
	});
	it('should handle mixed case and tabs/newlines', () => {
		const input = '\n\tHeLLo\t';
		const result = normalizeString(input);
		assert.strictEqual(result, 'hello');
	});
	it('should return empty string if given empty string', () => {
		const input = '';
		const result = normalizeString(input);
		assert.strictEqual(result, '');
	});
	it('should return empty string if input only whitespace', () => {
		const input = '    ';
		const result = normalizeString(input);
		assert.strictEqual(result, '');
	});
});
