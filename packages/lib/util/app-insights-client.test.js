import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import { ApplicationInsightsClient } from './app-insights-client.js';

// Mock implementations
const createMockLogsQueryClient = () => ({
	queryWorkspace: mock.fn(async () => ({
		status: 'Success',
		tables: [
			{
				columnDescriptors: [{ name: 'timestamp' }, { name: 'message' }, { name: 'severity' }],
				rows: [
					['2026-06-15T10:00:00Z', 'Test message 1', 'Info'],
					['2026-06-15T10:01:00Z', 'Test message 2', 'Warning']
				]
			}
		]
	}))
});

const createMockLogger = () => ({
	warn: mock.fn(),
	error: mock.fn(),
	info: mock.fn()
});

describe('ApplicationInsightsClient', () => {
	let mockClient;
	let mockLogger;
	let client;

	beforeEach(() => {
		mockClient = createMockLogsQueryClient();
		mockLogger = createMockLogger();
	});

	describe('constructor', () => {
		test('should initialize with workspaceId and logger', () => {
			// Allow passing a mock client to the constructor for testing
			client = new ApplicationInsightsClient('test-workspace-id', mockLogger, mockClient);
			assert.ok(client);
			assert.strictEqual(client.logger, mockLogger);
		});

		test('should accept optional client parameter for testing', () => {
			client = new ApplicationInsightsClient('test-workspace-id', mockLogger, mockClient);
			assert.ok(client);
		});
	});

	describe('queryLogs', () => {
		beforeEach(() => {
			client = new ApplicationInsightsClient('test-workspace-id', mockLogger, mockClient);
		});

		test('should return parsed rows as objects', async () => {
			const query = 'customMetrics | take 10';
			const timeSpan = 'PT1H';

			const result = await client.queryLogs(query, timeSpan);

			assert.strictEqual(Array.isArray(result), true);
			assert.strictEqual(result.length, 2);
			assert.deepStrictEqual(result[0], {
				timestamp: '2026-06-15T10:00:00Z',
				message: 'Test message 1',
				severity: 'Info'
			});
			assert.deepStrictEqual(result[1], {
				timestamp: '2026-06-15T10:01:00Z',
				message: 'Test message 2',
				severity: 'Warning'
			});
		});

		test('should return empty array when no tables in response', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Success',
				tables: []
			}));

			const result = await client.queryLogs('query', 'PT1H');

			assert.strictEqual(Array.isArray(result), true);
			assert.strictEqual(result.length, 0);
		});

		test('should return empty array when tables is null', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Success',
				tables: null
			}));

			const result = await client.queryLogs('query', 'PT1H');

			assert.strictEqual(Array.isArray(result), true);
			assert.strictEqual(result.length, 0);
		});

		test('should log warning for partial results', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Partial',
				tables: [
					{
						columnDescriptors: [{ name: 'data' }],
						rows: [['value']]
					}
				]
			}));

			await client.queryLogs('query', 'PT1H');

			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		});

		test('should log warning for partial results with context', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Partial',
				tables: [
					{
						columnDescriptors: [{ name: 'data' }],
						rows: [['value']]
					}
				]
			}));

			const mockContext = {
				log: mock.fn()
			};

			await client.queryLogs('query', 'PT1H', mockContext);

			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
			assert.strictEqual(mockContext.log.mock.callCount(), 1);
			assert.match(mockContext.log.mock.calls[0].arguments[0], /partial results/i);
		});

		test('should throw error when query fails', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Failed',
				error: { message: 'Invalid KQL syntax' }
			}));

			await assert.rejects(() => client.queryLogs('bad query', 'PT1H'), /KQL query failed: Invalid KQL syntax/);
		});

		test('should throw error with unknown error message when error object is missing', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Failed'
			}));

			await assert.rejects(() => client.queryLogs('bad query', 'PT1H'), /KQL query failed: Unknown error/);
		});

		test('should log error when queryWorkspace throws', async () => {
			mockClient.queryWorkspace = mock.fn(async () => {
				throw new Error('Network error');
			});

			await assert.rejects(() => client.queryLogs('query', 'PT1H'), /Network error/);

			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
		});

		test('should handle single row correctly', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Success',
				tables: [
					{
						columnDescriptors: [{ name: 'id' }, { name: 'name' }],
						rows: [[1, 'Alice']]
					}
				]
			}));

			const result = await client.queryLogs('query', 'PT1H');

			assert.strictEqual(result.length, 1);
			assert.deepStrictEqual(result[0], { id: 1, name: 'Alice' });
		});

		test('should handle different data types in columns', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Success',
				tables: [
					{
						columnDescriptors: [{ name: 'stringCol' }, { name: 'numberCol' }, { name: 'boolCol' }, { name: 'nullCol' }],
						rows: [['text', 42, true, null]]
					}
				]
			}));

			const result = await client.queryLogs('query', 'PT1H');

			assert.deepStrictEqual(result[0], {
				stringCol: 'text',
				numberCol: 42,
				boolCol: true,
				nullCol: null
			});
		});

		test('should pass query and timeSpan to client', async () => {
			mockClient.queryWorkspace = mock.fn(async () => ({
				status: 'Success',
				tables: []
			}));

			const testQuery = 'customMetrics | where name == "myMetric"';
			const testTimeSpan = 'P7D';

			await client.queryLogs(testQuery, testTimeSpan);

			assert.strictEqual(mockClient.queryWorkspace.mock.callCount(), 1);
			const call = mockClient.queryWorkspace.mock.calls[0];
			assert.strictEqual(call.arguments[1], testQuery);
			assert.strictEqual(call.arguments[2], testTimeSpan);
		});
	});

	describe('error handling', () => {
		beforeEach(() => {
			client = new ApplicationInsightsClient('test-workspace-id', mockLogger, mockClient);
		});

		test('should include query in error log context', async () => {
			mockClient.queryWorkspace = mock.fn(async () => {
				throw new Error('Test error');
			});

			const testQuery = 'test query';

			try {
				await client.queryLogs(testQuery, 'PT1H');
			} catch {
				// Expected error
			}

			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
			const errorCall = mockLogger.error.mock.calls[0];
			const errorData = errorCall.arguments[0];
			assert.strictEqual(errorData.query, testQuery);
			assert.ok(errorData.error);
		});
	});
});
