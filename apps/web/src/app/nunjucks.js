import { createRequire } from 'node:module';
import path from 'node:path';
import nunjucks from 'nunjucks';
import { loadBuildConfig } from './config.js';

/**
 * @returns {import('nunjucks').Environment}
 */
export function configureNunjucks() {
	const config = loadBuildConfig();

	// get the require function, see https://nodejs.org/api/module.html#modulecreaterequirefilename
	const require = createRequire(import.meta.url);
	// get the path to the govuk-frontend folder, in node_modules, using the node require resolution
	const govukFrontendRoot = path.resolve(require.resolve('govuk-frontend'), '../..');
	// get the path to the @pins/inspector-programming-lib folder, in node_modules, using the node require resolution
	const libUi = path.resolve(require.resolve('@pins/inspector-programming-lib'), '..');
	const appDir = path.join(config.srcDir, 'app');

	// configure nunjucks
	return nunjucks.configure(
		// ensure nunjucks templates can use govuk-frontend components, and templates we've defined in `web/src/app`
		[govukFrontendRoot, libUi, appDir],
		{
			// output with dangerous characters are escaped automatically
			autoescape: true,
			// automatically remove trailing newlines from a block/tag
			trimBlocks: true,
			// automatically remove leading whitespace from a block/tag
			lstripBlocks: true
		}
	);
}
