/**
 *
 * @param {import('@pins/inspector-programming-lib/graph/types.js').InitEntraClient} initEntraClient
 * @param {import('src/app/inspector/types.js').Inspector} selectedInspector
 * @param {import('src/app/auth/session.service.js').SessionWithAuth} authSession
 * @param {import('pino').Logger} logger
 * @returns
 */

export async function getSimplifiedEvents(initEntraClient, selectedInspector, authSession, logger) {
	const client = initEntraClient(authSession);

	if (!client) {
		logger.warn('Skipping calendar, no Entra Client');
		return [];
	}

	const eventsResponse = await client.getEvents(selectedInspector.id);
	const events = Array.isArray(eventsResponse.value) ? eventsResponse.value : [];

	return events.map((event) => {
		const startDateTime = new Date(event.start.dateTime);
		const endDateTime = new Date(event.end.dateTime);
		const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
		const roundedDurationMinutes = Math.ceil(durationMinutes / 30) * 30;
		const adjustedEndDateTime = new Date(startDateTime.getTime() + roundedDurationMinutes * 60 * 1000);

		return {
			subject: event.subject,
			startDateTime: startDateTime.toISOString(),
			endDateTime: adjustedEndDateTime.toISOString()
		};
	});
}
