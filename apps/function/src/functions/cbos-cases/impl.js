const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

const MAX_PAGES = 1000;

/**
 * @param {import('../../service').FunctionService} service
 * @returns {import('@azure/functions').HttpTriggerHandler}
 */
export function buildCbosFetchCases(service) {
	return async (request, context) => {
		try {
			context.log('fetching cases from Manage appeals');

			// not complete in one transaction as it can be too large, so not strictly atomic,
			// but should only need to be run once, as the service bus integration will handle data going forward
			const caseReferences = [];

			for (let pageNumber = 1; pageNumber < MAX_PAGES; pageNumber++) {
				context.log('syncing page number', pageNumber);
				// works more reliably with a smaller page size
				const appealsData = await service.cbosClient.getUnassignedCases({ pageNumber, pageSize: 50, fetchAll: false });
				context.log('got', appealsData.caseReferences.length, 'cases');
				if (appealsData.caseReferences.length === 0) {
					break;
				}
				caseReferences.push(...appealsData.caseReferences);

				context.log('starting db transaction');
				await service.dbClient.$transaction(async ($tx) => {
					context.log('upsert cases');
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
					context.log('upsert links');
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
					context.log('upsert poll status');

					// save in the DB that we have an update - done for each batch
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
				}, service.syncCasesTransactionOptions);
			}

			context.log('got', caseReferences.length, 'cases, removing others');
			await service.dbClient.$transaction(async ($tx) => {
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
				const { count } = await $tx.appealCase.deleteMany({
					where: {
						caseReference: {
							notIn: caseReferences
						}
					}
				});
				context.log('deleted', count, 'cases');

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
			}, service.syncCasesTransactionOptions);

			context.log('Finished fetching cases from Manage appeals');
		} catch (error) {
			context.log('Error during case fetch:', error.message);
			throw new Error(`Error during case fetch: ${error.message}`, { cause: error });
		} finally {
			context.log('Finished Manage appeals case fetch function execution');
		}
	};
}
