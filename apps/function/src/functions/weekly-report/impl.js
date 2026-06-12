import { formatDateForDisplay, getPreviousWeekRange } from '@pins/inspector-programming-lib/util/date.js';

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildHandleWeeklyReport(service) {
	return async function handleWeeklyCaseAssignments(myTimer, context) {
		try {
			context.log('Starting weekly case assignments function');

			// Get the previous week's date range (Monday to Sunday)
			const { weekStart, weekEnd } = getPreviousWeekRange();

			context.log(`Querying for case assignments between ${weekStart.toISOString()} and ${weekEnd.toISOString()}`);

			// Execute KQL query against Application Insights
			const caseAssignmentCount = await queryCaseAssignments(service, weekStart, weekEnd, context);

			context.log(`Found ${caseAssignmentCount} cases assigned in the previous week`);

			// Send email with the count
			await sendReportEmail(service, caseAssignmentCount, weekStart, context);

			context.log('Weekly case assignments function completed successfully');
		} catch (error) {
			context.error(`Error in weekly case assignments function: ${error.message}`);
			throw new Error(`Failed to process weekly case assignments: ${error.message}`, { cause: error });
		}
	};
}

/**
 * Query Application Insights for case assignments
 * @param {import('../../service').FunctionService} service
 * @param {Date} weekStart
 * @param {Date} weekEnd
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<number>}
 */
async function queryCaseAssignments(service, weekStart, weekEnd, context) {
	const query = `AppServiceConsoleLogs 
| where TimeGenerated >= todatetime("${weekStart.toISOString()}") and TimeGenerated <= todatetime("${weekEnd.toISOString()}")
| extend payload = parse_json(ResultDescription)
| where payload.msg startswith "Successfully assigned case"
| count`;

	const result = await service.appInsightsClient.queryLogs(query, { startTime: weekStart, endTime: weekEnd }, context);

	if (!result || !Array.isArray(result) || result.length === 0) {
		context.log('No results from Application Insights query');
		return 0;
	}

	// The count query returns a single row with "Count" column
	const row = result[0];
	const count = row.Count !== undefined ? parseInt(row.Count, 10) : 0;

	context.log(`Query returned count: ${count}`);
	return count;
}

/**
 * Send email with weekly case assignment count
 * @param {import('../../service').FunctionService} service
 * @param {number} caseCount
 * @param {Date} weekStart
 * @param {import('@azure/functions').InvocationContext} context
 * @returns {Promise<void>}
 */
async function sendReportEmail(service, caseCount, weekStart, context) {
	if (!service.govNotifyClient) {
		context.log('Gov Notify client not configured, skipping email');
		return;
	}

	const recipientEmail = service.weeklyReportEmail;
	if (!recipientEmail) {
		context.log('Weekly report email address not configured');
		return;
	}

	try {
		const personalisation = {
			weekStart: formatDateForDisplay(weekStart),
			casesCount: caseCount.toString(),
			greeting: formatDateForDisplay(new Date(), { format: 'aaa' }) === 'am' ? 'Good morning' : 'Good afternoon'
		};

		context.log(`Sending weekly case assignment email to ${recipientEmail}`, personalisation);

		await service.govNotifyClient.sendWeeklyReportEmail(recipientEmail, personalisation);

		context.log('Weekly case assignment email sent successfully');
	} catch (error) {
		context.error(`Error sending weekly case assignment email: ${error.message}`);
		throw new Error(`Failed to send email: ${error.message}`, { cause: error });
	}
}
