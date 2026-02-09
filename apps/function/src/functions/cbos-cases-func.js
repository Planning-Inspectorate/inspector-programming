import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildCbosFetchCases } from './cbos-cases/impl.js';

const service = initialiseService();

// Http trigger
app.http('sync-cbos-cases', {
	methods: ['GET'],
	authLevel: 'function',
	handler: buildCbosFetchCases(service)
});
