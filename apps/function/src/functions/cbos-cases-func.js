import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildCbosFetchCases } from './cbos-cases/impl.js';

const service = initialiseService();

app.timer('cbos-cases', {
	schedule: service.cbosFetchCasesSchedule,
	handler: buildCbosFetchCases(service)
});
