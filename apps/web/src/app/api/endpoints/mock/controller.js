import { generateMockData } from './mock.js';

/**
 * @param {import('#service').WebService} service
 * @returns {{inspectors: import('express').Handler, events: import('express').Handler}}
 */
export function buildMockApiControllers(service) {
	const config = {
		inspectorCount: 200,
		weeksFromToday: 26
	};
	/** @type {import('../../types.d.ts').MockData|undefined} */
	let mockData;
	return {
		inspectors(req, res) {
			if (!mockData) {
				mockData = generateMockData(service, config);
			}
			res.json(mockData.inspectors);
		},
		events(req, res) {
			if (!mockData) {
				mockData = generateMockData(service, config);
			}
			res.json(mockData.events);
		}
	};
}
