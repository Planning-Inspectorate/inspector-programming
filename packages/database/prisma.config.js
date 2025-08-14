import { defineConfig } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
	schema: path.join('src', 'schema.prisma'),
	migrations: {
		path: path.join('src', 'migrations'),
		seed: 'node src/seed/seed-dev.js'
	}
});
