const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (timer, context) => {
		service.cbosClient.contextLogger = context;
		try {
			context.log('fetching cases from CBOS');

			// Fetches and filters unassigned cases from cbos
			const appealsData = await service.cbosClient.getUnassignedCases();

			context.log(`fetched ${appealsData.caseReferences.length} cases, adding to database.`);
			if (appealsData.failedCaseReferences.length > 0) {
				context.error(
					`failed to fetch ${appealsData.failedCaseReferences.length} cases: ${appealsData.failedCaseReferences.join(',')}`
				);
			}

			await service.dbClient.$transaction(async ($tx) => {
				// Updates/creates cases within the inspector programming database
				await Promise.all(
					appealsData.cases.map((appeal) => {
						const data = {
							...omit(appeal, ['leadCaseReference', 'lpaCode', 'childCaseReferences']),
							Lpa: { connect: { lpaCode: appeal.lpaCode } }
						};
						return $tx.appealCase.upsert({
							where: { caseReference: appeal.caseReference },
							update: omit(data, ['caseReference']),
							create: data
						});
					})
				);

				// Add links between cases (if parent case is not pulled from cbos, case will still be marked as child in linkedCaseStatus)
				const childCases = appealsData.cases.filter(
					(appeal) => appeal.leadCaseReference && appealsData.caseReferences.includes(appeal.leadCaseReference)
				);
				await Promise.all(
					childCases.map((appeal) => {
						return $tx.appealCase.update({
							where: { caseReference: appeal.caseReference },
							data: {
								LeadCase: { connect: { caseReference: appeal.leadCaseReference } }
							}
						});
					})
				);

				const caseReferences = [
					...appealsData.caseReferences,
					// don't delete or unlink case references which failed to fetch
					...appealsData.failedCaseReferences
				];

				// Remove any old links from cases to be deleted
				await $tx.appealCase.updateMany({
					where: {
						leadCaseReference: {
							notIn: caseReferences
						}
					},
					data: {
						leadCaseReference: null
					}
				});

				// Delete any cases that are no longer in cbos
				await $tx.appealCase.deleteMany({
					where: {
						caseReference: {
							notIn: caseReferences
						}
					}
				});

				// Create record of latest successful update
				await $tx.appealCasePollStatus.create({
					data: {
						lastPollAt: new Date(),
						casesFetched: appealsData.caseReferences.length
					}
				});
			});

			context.log('cases added to database');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error(`Error during case fetch: ${error.message}`);
		} finally {
			context.log('timer object:', timer);
			service.cbosClient.contextLogger = undefined;
		}
	};
}
