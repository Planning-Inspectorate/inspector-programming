import newJwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

export class ApiAuthService {
	/** @type {import('../../config-types.js').Config['auth']} */
	#config;
	/** @type {import('jwks-rsa').JwksClient} */
	#jwksClient;

	/**
	 *
	 * @param {Object} opts
	 * @param {import('../config-types.js').Config['auth']} opts.config
	 * @param {import('jwks-rsa').JwksClient} [opts.jwksClient] - for testing
	 */
	constructor({ config, jwksClient }) {
		this.#config = config;
		this.#jwksClient =
			jwksClient ||
			newJwksClient({
				jwksUri: this.#config.discoveryKeysEndpoint
			});
	}

	/**
	 * @returns {string}
	 */
	get authTokenUrl() {
		const params = new URLSearchParams({
			client_id: this.#config.clientId,
			response_type: 'token',
			scope: `${this.#config.appDomain}/Api.Read`
		});
		return this.#config.authority + '/oauth2/v2.0/authorize?' + params.toString();
	}

	/**
	 * @param {string} token
	 * @returns {Promise<void>}
	 */
	async verifyApiToken(token) {
		const getSigningKeys = (header, callback) => {
			this.#jwksClient.getSigningKey(header.kid, (error, key) => {
				if (error) {
					return callback(error);
				}
				const signingKey = key.publicKey || key.rsaPublicKey;
				callback(null, signingKey);
			});
		};
		return new Promise((resolve, reject) => {
			jwt.verify(token, getSigningKeys, this.#apiValidationOptions, (err, decoded) => {
				if (err) {
					reject(err);
					return;
				}
				const issuer = decoded.iss;
				if (!issuer || !issuer.match(new RegExp(`^https://.*/${this.#config.tenantId}/?$`))) {
					reject(new Error(`invalid issuer: ${issuer}`));
					return;
				}
				resolve();
			});
		});
	}

	/**
	 * JWT validation options for the API.
	 * @returns {{audience: string}}
	 */
	get #apiValidationOptions() {
		return {
			audience: this.#config.appDomain
		};
	}
}
