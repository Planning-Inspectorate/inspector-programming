const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').HttpTriggerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (request, context) => {
		try {
			context.log('fetching cases from CBOS');

			// Fetches and filters unassigned cases from cbos
			const appealsData = await service.cbosClient.getUnassignedCases();

			await service.dbClient.$transaction(async ($tx) => {
				// Updates/creates cases within the inspector programming database
				await Promise.all(
					appealsData.cases.map((appeal) => {
						return $tx.appealCase.upsert({
							where: { caseReference: appeal.caseReference },
							update: {
								...omit(appeal, ['caseReference', 'leadCaseReference', 'lpaCode', 'childCaseReferences']),
								Lpa: { connect: { lpaCode: appeal.lpaCode } }
							},
							create: {
								...omit(appeal, ['leadCaseReference', 'lpaCode', 'childCaseReferences']),
								Lpa: { connect: { lpaCode: appeal.lpaCode } }
							}
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

				// Remove any old links from cases to be deleted
				await $tx.appealCase.updateMany({
					where: {
						leadCaseReference: {
							notIn: appealsData.caseReferences
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
							notIn: appealsData.caseReferences
						}
					}
				});

				// save in the DB that we have an update
				await $tx.appealCasePollStatus.upsert({
					where: { id: 1 },
					create: {
						lastPollAt: new Date(),
						casesFetched: -1 // not used
					},
					update: {
						lastPollAt: new Date()
					}
				});
			});

			context.log('Finished fetching cases from CBOS');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error(`Error during case fetch: ${error.message}`);
		} finally {
			context.log('Finished CBOS case fetch function execution');
		}
	};
}
