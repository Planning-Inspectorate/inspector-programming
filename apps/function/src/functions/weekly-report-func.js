import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleWeeklyReport } from './weekly-report/impl.js';

const service = initialiseService();

if (service.weeklyReportEnabled) {
	service.logger.info('registering weekly-report');
	// Timer trigger - runs every Monday at 9am (using NCRONTAB)
	app.timer('weekly-report', {
		schedule: '0 0 9 * * 1',
		handler: buildHandleWeeklyReport(service)
	});
} else {
	service.logger.info('weekly-report not configured');
}
