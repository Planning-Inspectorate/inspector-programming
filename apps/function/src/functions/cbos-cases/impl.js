const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (timer, context) => {
		try {
			context.log('fetching cases from CBOS');
			const appealsData = await service.cbosClient.getUnassignedCases();

			await service.dbClient.$transaction(
				appealsData.cases.map((c) =>
					service.dbClient.appealCase.upsert({
						where: { caseReference: c.caseReference },
						update: { ...omit(c, ['caseReference']) },
						create: { ...c }
					})
				)
			);

			await service.dbClient.appealCase.deleteMany({
				where: {
					caseReference: {
						notIn: appealsData.caseReferences
					}
				}
			});
			context.log('cases fetched');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			console.log(error.message);
			throw new Error('Error during case fetch');
		} finally {
			context.log('timer object:', timer);
		}
	};
}
