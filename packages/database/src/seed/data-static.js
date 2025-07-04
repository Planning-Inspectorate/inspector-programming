/**
 * @param {import('@pins/service-name-database/src/client').PrismaClient} dbClient
 */
export async function seedStaticData(dbClient) {
	// TODO: add static seed data
	await dbClient.$queryRaw`SELECT 1`;
	console.log('static data seed complete');
}
