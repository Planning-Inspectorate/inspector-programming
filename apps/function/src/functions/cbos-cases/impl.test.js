import { describe, test, mock, beforeEach } from 'node:test';
import { buildCbosFetchCases } from './impl.js';
import assert from 'node:assert';

describe('cbos-cases-impl', () => {
	const service = {
		dbClient: {
			$transaction: mock.fn(),
			appealCase: {
				upsert: mock.fn(),
				deleteMany: mock.fn()
			},
			appealCasePollStatus: {
				create: mock.fn()
			}
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
		assert.strictEqual(service.dbClient.appealCase.upsert.mock.callCount(), 2);
		assert.deepStrictEqual(service.dbClient.appealCase.upsert.mock.calls[0].arguments[0], {
			where: { caseReference: '1' },
			update: {
				caseId: 1,
				Lpa: { connect: { lpaCode: 'lpaCode1' } },
				LeadCase: undefined,
				ChildCases: { connect: [{ caseReference: '2' }] }
			},
			create: {
				caseReference: '1',
				caseId: 1,
				Lpa: { connect: { lpaCode: 'lpaCode1' } },
				LeadCase: undefined,
				ChildCases: { connect: [{ caseReference: '2' }] }
			}
		});
		assert.deepStrictEqual(service.dbClient.appealCase.upsert.mock.calls[1].arguments[0], {
			where: { caseReference: '2' },
			update: {
				caseId: 2,
				Lpa: { connect: { lpaCode: 'lpaCode2' } },
				LeadCase: { connect: { caseReference: '1' } },
				ChildCases: undefined
			},
			create: {
				caseReference: '2',
				caseId: 2,
				Lpa: { connect: { lpaCode: 'lpaCode2' } },
				LeadCase: { connect: { caseReference: '1' } },
				ChildCases: undefined
			}
		});
		assert.strictEqual(service.dbClient.appealCase.deleteMany.mock.callCount(), 1);
		assert.deepStrictEqual(service.dbClient.appealCase.deleteMany.mock.calls[0].arguments[0], {
			where: { caseReference: { notIn: ['1', '2'] } }
		});
		assert.strictEqual(service.dbClient.appealCasePollStatus.create.mock.callCount(), 1);
		assert.deepStrictEqual(service.dbClient.appealCasePollStatus.create.mock.calls[0].arguments[0], {
			data: { lastPollAt: new Date(), casesFetched: 2 }
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
