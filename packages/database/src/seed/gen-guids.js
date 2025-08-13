import { randomUUID } from 'node:crypto';

// print out GUIDs for use in development data seeding
function run() {
	for (let i = 0; i < 100; i++) {
		console.log(`'${randomUUID()}',`);
	}
}

run();
