const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (timer, context) => {
		try {
			context.log('fetching cases from CBOS');

			// Fetchs and filters unassigned cases from cbos
			const appealsData = await service.cbosClient.getUnassignedCases();

			// Updates/creates cases within the inspector programming database
			await service.dbClient.$transaction(
				appealsData.cases.map((appeal) =>
					service.dbClient.appealCase.upsert({
						where: { caseReference: appeal.caseReference },
						update: { ...omit(appeal, ['caseReference']) },
						create: { ...appeal }
					})
				)
			);

			// Delete any cases that are no longer in cbos
			await service.dbClient.appealCase.deleteMany({
				where: {
					caseReference: {
						notIn: appealsData.caseReferences
					}
				}
			});

			// Create record of latest successfull update
			await service.dbClient.appealCasePollStatus.create({
				data: {
					lastPollAt: new Date(),
					casesFetched: appealsData.caseReferences.length
				}
			});

			context.log('cases fetched');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error('Error during case fetch');
		} finally {
			context.log('timer object:', timer);
		}
	};
}
