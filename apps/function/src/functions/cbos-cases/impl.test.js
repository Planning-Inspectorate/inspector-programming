import { describe, test, mock, beforeEach } from 'node:test';
import { buildCbosFetchCases } from './impl.js';
import assert from 'node:assert';

describe('cbos-cases-impl', () => {
	const mockUpsert = mock.fn();
	const mockUpdate = mock.fn();
	const mockUpdateMany = mock.fn();
	const mockDeleteMany = mock.fn();
	const mockStatusUpsert = mock.fn();
	const service = {
		dbClient: {
			$transaction: mock.fn(async (callback) => {
				const mockTx = {
					appealCase: {
						upsert: mockUpsert,
						update: mockUpdate,
						updateMany: mockUpdateMany,
						deleteMany: mockDeleteMany
					},
					appealCasePollStatus: {
						upsert: mockStatusUpsert
					}
				};
				return await callback(mockTx);
			})
		},
		cbosClient: {
			getUnassignedCases: mock.fn()
		}
	};

	beforeEach(() => {
		service.cbosClient.getUnassignedCases.mock.resetCalls();
	});

	test('should call the cbos api and update database', async (ctx) => {
		ctx.mock.timers.enable({
			apis: ['Date'],
			now: new Date('2023-10-04T12:00:00Z')
		});
		const appealsData = {
			cases: [
				{ caseReference: '1', caseId: 1, lpaCode: 'lpaCode1', childCaseReferences: [{ caseReference: '2' }] },
				{ caseReference: '2', caseId: 2, lpaCode: 'lpaCode2', leadCaseReference: '1', childCaseReferences: [] }
			],
			caseReferences: ['1', '2']
		};
		service.cbosClient.getUnassignedCases.mock.mockImplementationOnce(() => appealsData);
		const handler = buildCbosFetchCases(service);
		await handler({}, { log: console.log });
		assert.strictEqual(service.cbosClient.getUnassignedCases.mock.callCount(), 1);
		assert.strictEqual(service.dbClient.$transaction.mock.callCount(), 1);
		assert.strictEqual(mockUpsert.mock.callCount(), 2);
		assert.deepStrictEqual(mockUpsert.mock.calls[0].arguments[0], {
			where: { caseReference: '1' },
			update: {
				caseId: 1,
				Lpa: { connect: { lpaCode: 'lpaCode1' } }
			},
			create: {
				caseReference: '1',
				caseId: 1,
				Lpa: { connect: { lpaCode: 'lpaCode1' } }
			}
		});
		assert.deepStrictEqual(mockUpsert.mock.calls[1].arguments[0], {
			where: { caseReference: '2' },
			update: {
				caseId: 2,
				Lpa: { connect: { lpaCode: 'lpaCode2' } }
			},
			create: {
				caseReference: '2',
				caseId: 2,
				Lpa: { connect: { lpaCode: 'lpaCode2' } }
			}
		});
		assert.strictEqual(mockUpdate.mock.callCount(), 1);
		assert.deepStrictEqual(mockUpdate.mock.calls[0].arguments[0], {
			where: { caseReference: '2' },
			data: {
				LeadCase: { connect: { caseReference: '1' } }
			}
		});
		assert.strictEqual(mockUpdateMany.mock.callCount(), 1);
		assert.deepStrictEqual(mockUpdateMany.mock.calls[0].arguments[0], {
			where: {
				leadCaseReference: {
					notIn: ['1', '2']
				}
			},
			data: {
				leadCaseReference: null
			}
		});
		assert.strictEqual(mockDeleteMany.mock.callCount(), 1);
		assert.deepStrictEqual(mockDeleteMany.mock.calls[0].arguments[0], {
			where: { caseReference: { notIn: ['1', '2'] } }
		});
		assert.strictEqual(mockStatusUpsert.mock.callCount(), 1);
		assert.deepStrictEqual(mockStatusUpsert.mock.calls[0].arguments[0], {
			where: { id: 1 },
			create: { lastPollAt: new Date(), casesFetched: -1 },
			update: { lastPollAt: new Date() }
		});
	});
	test('should call context.log on error', async () => {
		const context = {
			log: mock.fn()
		};
		service.cbosClient.getUnassignedCases.mock.mockImplementationOnce(() => {
			throw new Error('CBOS error');
		});
		const handler = buildCbosFetchCases(service);
		await assert.rejects(() => handler({}, context));
		assert.strictEqual(service.cbosClient.getUnassignedCases.mock.callCount(), 1);
		assert.strictEqual(context.log.mock.callCount(), 3);
		assert.strictEqual(context.log.mock.calls[1].arguments[1], 'CBOS error');
	});
});
