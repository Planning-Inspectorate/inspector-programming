import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildBackfillCaseOfficers } from './backfill-case-officers/impl.js';

const service = initialiseService();

// Http trigger - run manually to backfill caseOfficerId for existing cases
app.http('backfill-case-officers', {
	methods: ['POST'],
	authLevel: 'function',
	handler: buildBackfillCaseOfficers(service)
});
