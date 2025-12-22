import Ajv from 'ajv';
import { loadAllSchemas } from '@planning-inspectorate/data-model';

/** @type {Promise<import("ajv").default> | null} */
let ajvInit = null;

/** @type {import("ajv").default | null} */
let cachedAjv = null;

/* Cache Ajv instance to avoid re-initialising on every function invocation */
/**
 * @returns {Promise<import("ajv").default>}
 */
export async function getCachedAjv() {
	if (cachedAjv) return cachedAjv;
	if (!ajvInit) {
		ajvInit = (async () => {
			try {
				const schemas = await loadAllSchemas();
				return new Ajv({ allErrors: true, strict: false, schemas });
			} catch (error) {
				ajvInit = null;
				throw new Error(`Failed to initialise AJV instance. Error: ${error.message}`);
			}
		})();
	}
	cachedAjv = await ajvInit;
	return cachedAjv;
}
