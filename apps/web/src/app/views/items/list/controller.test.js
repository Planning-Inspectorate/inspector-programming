import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { buildListItems } from './controller.js';
import { configureNunjucks } from '../../../nunjucks.js';
import { mockLogger } from '@pins/service-name-lib/testing/mock-logger.js';

describe('list items', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		// mock response that calls nunjucks to render a result
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};
		const listItems = buildListItems({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => listItems({}, mockRes));
		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/items/list/view.njk');
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[1].pageHeading, 'Some Service Name');
	});
});
