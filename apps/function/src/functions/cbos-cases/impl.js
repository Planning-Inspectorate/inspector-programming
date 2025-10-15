const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').TimerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (timer, context) => {
		try {
			context.log('fetching cases from CBOS');

			// Fetches and filters unassigned cases from cbos
			const appealsData = await service.cbosClient.getUnassignedCases();

			// Updates/creates cases within the inspector programming database
			await service.dbClient.$transaction(
				appealsData.cases.map((appeal) => {
					return service.dbClient.appealCase.upsert({
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

			// Add links between cases
			const childCases = appealsData.cases.filter((appeal) => appeal.leadCaseReference);
			await service.dbClient.$transaction(
				childCases.map((appeal) => {
					return service.dbClient.appealCase.update({
						where: { caseReference: appeal.caseReference },
						data: {
							LeadCase: { connect: { caseReference: appeal.leadCaseReference } }
						}
					});
				})
			);

			// Remove any old links from cases to be deleted
			await service.dbClient.appealCase.updateMany({
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
			await service.dbClient.appealCase.deleteMany({
				where: {
					caseReference: {
						notIn: appealsData.caseReferences
					}
				}
			});

			// Create record of latest successful update
			await service.dbClient.appealCasePollStatus.create({
				data: {
					lastPollAt: new Date(),
					casesFetched: appealsData.caseReferences.length
				}
			});

			context.log('cases fetched');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error(`Error during case fetch: ${error.message}`);
		} finally {
			context.log('timer object:', timer);
		}
	};
}
