/**
 * @param {import('@pins/inspector-programming-database/src/client').PrismaClient} dbClient
 */
export async function seedDev(dbClient) {
	// TODO: add seed data
	await dbClient.$queryRaw`SELECT 1`;

	console.log('dev seed complete');
}
