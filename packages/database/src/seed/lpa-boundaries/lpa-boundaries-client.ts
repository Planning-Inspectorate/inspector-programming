const PLANNING_DATA_API = 'https://www.planning.data.gov.uk/entity.json';
const DEFAULT_TIMEOUT_MS = 30000;
const PAGE_LIMIT = 500; // API max page size
const COUNTIES_API =
	'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Counties_and_Unitary_Authorities_December_2025_Boundaries_UK_BFC/FeatureServer/0/query';

/**
 * Client for fetching Local Planning Authority (LPA) boundary geometries from the
 * planning.data.gov.uk entity API.
 *
 * @module LpaBoundariesClient
 */
export class LpaBoundariesClient {
	async getCountyBoundary(reference: string) {
		const query = new URLSearchParams({
			outFields: 'CTYUA25NM',
			f: 'json',
			where: `CTYUA25CD = '${reference}'`
		});
		const url = COUNTIES_API + '?' + query.toString();
		const res = await this.fetchWithTimeout(url, 45_000);
		if (!res.ok) {
			let body;
			try {
				body = await res.text();
			} catch {}
			throw new Error(`Failed to fetch county boundary for ${reference}. Status: ${res.status} ${body}`);
		}
		const data: ArcgisCountiesResponse | ArcgisErrorResponse = await res.json();
		if (isError(data)) {
			throw new Error(`Failed to fetch county boundary for ${reference}, ${JSON.stringify(data.error)}`);
		}
		if (data.features.length !== 1) {
			return null;
		}
		return data.features[0].geometry;
	}
	/**
	 * Fetches all LPA boundaries as a single GeoJSON FeatureCollection.
	 */
	async getLpaBoundaries(): Promise<GeoJsonFeature[]> {
		const entities: LpaEntity[] = [];

		// fetch the first page to discover the total `count`, then page through using `offset`
		const firstPage = await this.#fetchPage(0);
		entities.push(...(firstPage.entities || []));
		const total = firstPage.count ?? entities.length;

		let offset = PAGE_LIMIT;
		while (entities.length < total) {
			const page = await this.#fetchPage(offset);
			if (!page.entities || page.entities.length === 0) {
				break;
			}
			entities.push(...page.entities);
			offset += PAGE_LIMIT;
		}

		return entities.map((entity) => entityToFeature(entity)).filter((feature) => feature.geometry !== null);
	}

	/**
	 * Fetches a single page from the entity API.
	 */
	async #fetchPage(offset: number): Promise<LpaEntityResponse> {
		const params = new URLSearchParams({
			dataset: 'local-planning-authority',
			limit: String(PAGE_LIMIT),
			offset: String(offset)
		});
		const url = `${PLANNING_DATA_API}?${params.toString()}`;

		const response = await this.fetchWithTimeout(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch LPA boundaries from ${url}. Status: ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Fetch wrapper with timeout.
	 */
	async fetchWithTimeout(url: string, timeout?: number): Promise<Response> {
		const timeoutMs = timeout || DEFAULT_TIMEOUT_MS;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: { Accept: 'application/json' },
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`, { cause: error });
			}
			throw error;
		}
	}
}

/**
 * Maps an LPA entity (with WKT geometry) to a GeoJSON Feature.
 */
export function entityToFeature(entity: LpaEntity): GeoJsonFeature {
	return {
		type: 'Feature',
		geometry: wktToGeoJsonGeometry(entity.geometry),
		properties: {
			entity: entity.entity,
			name: entity.name,
			reference: entity.reference,
			dataset: entity.dataset
		}
	};
}

/**
 * Converts a WKT geometry string (POLYGON, MULTIPOLYGON or POINT) to a GeoJSON geometry.
 * Returns null for empty or unsupported geometry.
 */
export function wktToGeoJsonGeometry(wkt: string | null | undefined): GeoJsonGeometry | null {
	if (!wkt || typeof wkt !== 'string') {
		return null;
	}
	const trimmed = wkt.trim();
	const parenIndex = trimmed.indexOf('(');
	if (parenIndex === -1) {
		return null;
	}
	const type = trimmed.slice(0, parenIndex).trim().toUpperCase();
	const body = trimmed.slice(parenIndex);

	const pos = { i: 0 };
	const parsed = parseGroup(body, pos);

	switch (type) {
		case 'POINT':
			// leaf is an array with a single coordinate pair
			return { type: 'Point', coordinates: parsed[0] };
		case 'POLYGON':
			return { type: 'Polygon', coordinates: parsed };
		case 'MULTIPOLYGON':
			return { type: 'MultiPolygon', coordinates: parsed };
		default:
			return null;
	}
}

/**
 * Recursively parses a parenthesised WKT group. A group either contains nested groups
 * or a flat coordinate list (the deepest level), matching the regular structure of
 * POINT / POLYGON / MULTIPOLYGON geometries.
 */
function parseGroup(str: string, pos: { i: number }): any[] {
	pos.i++; // skip opening '('
	const children = [];
	let buffer = '';
	while (pos.i < str.length) {
		const ch = str[pos.i];
		if (ch === '(') {
			children.push(parseGroup(str, pos));
		} else if (ch === ')') {
			pos.i++; // skip closing ')'
			return children.length > 0 ? children : parseCoordinateList(buffer);
		} else {
			buffer += ch;
			pos.i++;
		}
	}
	return children;
}

/**
 * Parses a flat WKT coordinate list, e.g. "-1.55 54.88, -1.56 54.88" into [[x, y], ...].
 * @param {string} str
 * @returns {number[][]}
 */
function parseCoordinateList(str: string): number[][] {
	return str
		.split(',')
		.map((pair) => pair.trim())
		.filter(Boolean)
		.map((pair) => pair.split(/\s+/).map(Number));
}

/**
 * A single entity as returned by the planning.data.gov.uk entity.json API.
 * Geometry and point are WKT strings.
 */
export interface LpaEntity {
	'entry-date'?: string;
	'start-date'?: string;
	'end-date'?: string;
	entity: number;
	name: string;
	dataset: string;
	typology?: string;
	reference: string;
	prefix?: string;
	'organisation-entity'?: string;
	geometry?: string;
	point?: string;
	quality?: string;
}

/**
 * The entity.json API response shape.
 */
export interface LpaEntityResponse {
	entities: LpaEntity[];
	links?: {
		first?: string;
		last?: string;
		next?: string;
		prev?: string;
	};
	count: number;
}

export interface GeoJsonGeometry {
	type: 'Point' | 'Polygon' | 'MultiPolygon';
	coordinates: unknown;
}

export interface GeoJsonFeature {
	type: 'Feature';
	geometry: GeoJsonGeometry | null;
	properties: Record<string, unknown>;
}

function isError(res: ArcgisErrorResponse | ArcgisCountiesResponse): res is ArcgisErrorResponse {
	return 'error' in res;
}

export interface ArcgisErrorResponse {
	error: any;
}

export interface ArcgisCountiesResponse {
	features: {
		attributes: {
			CTYUA25NM: string;
			CTYUA25CD: string;
		};
		geometry: {
			rings: number[][];
		};
	}[];
}
