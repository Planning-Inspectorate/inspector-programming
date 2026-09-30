import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createRoutes } from './index.js';

describe('assignments routes', () => {
	it('should register assignment endpoints under the assignments path', () => {
		const router = createRoutes({});
		const routes = router.stack
			.filter((layer) => layer.route)
			.map((layer) => ({
				path: layer.route.path,
				methods: Object.keys(layer.route.methods)
			}));

		assert.deepEqual(routes, [
			{ path: '/', methods: ['get'] },
			{ path: '/assign', methods: ['post'] },
			{ path: '/remove', methods: ['post'] }
		]);
	});
});
