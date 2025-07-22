import { describe, test } from 'node:test';
import assert from 'assert';
import jwt from 'jsonwebtoken';
import { ApiAuthService } from './api-auth-service.js';

function getMockedService({ getSigningKeyImpl }) {
	const config = {
		discoveryKeysEndpoint: 'https://example.com/.well-known/jwks.json',
		clientId: 'client-id',
		appDomain: 'app-domain',
		authority: 'https://authority',
		tenantId: 'tenant-id'
	};
	return new ApiAuthService({
		config,
		jwksClient: {
			getSigningKey: getSigningKeyImpl
		}
	});
}

describe('api-auth-service.js', () => {
	test('verifyApiToken resolves for valid key', async () => {
		const dummyToken = jwt.sign({ foo: 'bar' }, 'test-key', {
			header: { kid: '123' },
			audience: 'app-domain',
			issuer: 'https://example.com/tenant-id'
		});
		const service = getMockedService({
			getSigningKeyImpl: (kid, cb) => cb(null, { publicKey: 'test-key' })
		});
		await assert.doesNotReject(() => service.verifyApiToken(dummyToken));
	});

	test('verifyApiToken rejects for invalid audience', async () => {
		const dummyToken = jwt.sign({ foo: 'bar' }, 'test-key', {
			header: { kid: '123' },
			audience: 'blah',
			issuer: 'https://example.com/tenant-id'
		});
		const service = getMockedService({
			getSigningKeyImpl: (kid, cb) => cb(null, { publicKey: 'test-key' })
		});
		await assert.rejects(() => service.verifyApiToken(dummyToken), {
			name: 'JsonWebTokenError',
			message: 'jwt audience invalid. expected: app-domain'
		});
	});

	test('verifyApiToken rejects for invalid issuer', async () => {
		const dummyToken = jwt.sign({ foo: 'bar' }, 'test-key', {
			header: { kid: '123' },
			audience: 'app-domain',
			issuer: 'https://example.com/tenant-2'
		});
		const service = getMockedService({
			getSigningKeyImpl: (kid, cb) => cb(null, { publicKey: 'test-key' })
		});
		await assert.rejects(() => service.verifyApiToken(dummyToken), {
			name: 'Error',
			message: 'invalid issuer: https://example.com/tenant-2'
		});
	});

	test('verifyApiToken rejects for expired token', async () => {
		const dummyToken = jwt.sign({ foo: 'bar' }, 'test-key', {
			header: { kid: '123' },
			audience: 'app-domain',
			expiresIn: -1, // expired token
			issuer: 'https://example.com/tenant-id'
		});
		const service = getMockedService({
			getSigningKeyImpl: (kid, cb) => cb(null, { publicKey: 'test-key' })
		});
		await assert.rejects(() => service.verifyApiToken(dummyToken), {
			name: 'TokenExpiredError',
			message: 'jwt expired'
		});
	});
});
