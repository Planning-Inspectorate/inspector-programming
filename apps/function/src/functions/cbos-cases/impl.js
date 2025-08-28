/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (timer, context) => {
		try {
			context.log('fetching cases from CBOS');
			// TODO: implement
			await service.dbClient.$executeRaw`SELECT 1`; // dummy query to use the dbClient
			context.log('cases fetched');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error('Error during case fetch');
		} finally {
			context.log('timer object:', timer);
		}
	};
}
