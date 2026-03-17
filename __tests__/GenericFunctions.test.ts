/**
 * Unit tests for sanitizeError() in GenericFunctions.ts.
 *
 * sanitizeError is not exported, so we test it indirectly via a re-export shim
 * or by copying the logic here.  Since the function is small and self-contained
 * we test the behaviour we care about:  Authorization headers are removed and
 * nothing else breaks.
 *
 * NOTE: sanitizeError is not exported from GenericFunctions.ts.
 * We re-implement the same logic here so we can unit-test it without modifying
 * the source.  Any future export of the function should replace this.
 */

// ---------------------------------------------------------------------------
// Local copy of sanitizeError (mirrors GenericFunctions.ts exactly)
// ---------------------------------------------------------------------------
type JsonObject = Record<string, unknown>;

function sanitizeError(error: unknown): JsonObject {
	if (!error || typeof error !== 'object') return error as JsonObject;
	const err = { ...(error as Record<string, unknown>) };

	const stripAuth = (obj: Record<string, unknown>): Record<string, unknown> => {
		const copy = { ...obj };
		if (copy.headers && typeof copy.headers === 'object') {
			const headers = { ...(copy.headers as Record<string, unknown>) };
			delete headers['Authorization'];
			delete headers['authorization'];
			copy.headers = headers;
		}
		return copy;
	};

	if (err.config && typeof err.config === 'object') {
		err.config = stripAuth(err.config as Record<string, unknown>);
	}
	if (err.options && typeof err.options === 'object') {
		err.options = stripAuth(err.options as Record<string, unknown>);
	}
	if (err.request && typeof err.request === 'object') {
		const req = err.request as Record<string, unknown>;
		if (req.headers) {
			err.request = stripAuth(req);
		}
	}
	return err as JsonObject;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sanitizeError()', () => {
	describe('Authorization header removal', () => {
		it('strips Authorization header from error.config', () => {
			const err = {
				config: {
					headers: {
						Authorization: 'Bearer secret123',
						'Content-Type': 'application/json',
					},
				},
			};
			const sanitized = sanitizeError(err);
			const headers = (sanitized.config as Record<string, unknown>)
				?.headers as Record<string, unknown>;
			expect(headers?.Authorization).toBeUndefined();
			expect(headers?.['Content-Type']).toBe('application/json');
		});

		it('strips lowercase authorization header from error.config', () => {
			const err = {
				config: {
					headers: {
						authorization: 'Bearer lowercase-token',
						'X-Custom': 'keep-me',
					},
				},
			};
			const sanitized = sanitizeError(err);
			const headers = (sanitized.config as Record<string, unknown>)
				?.headers as Record<string, unknown>;
			expect(headers?.authorization).toBeUndefined();
			expect(headers?.['X-Custom']).toBe('keep-me');
		});

		it('strips Authorization header from error.options (request-promise style)', () => {
			const err = {
				options: {
					headers: {
						Authorization: 'Bearer opt-secret',
						Accept: 'application/json',
					},
				},
			};
			const sanitized = sanitizeError(err);
			const headers = (sanitized.options as Record<string, unknown>)
				?.headers as Record<string, unknown>;
			expect(headers?.Authorization).toBeUndefined();
			expect(headers?.Accept).toBe('application/json');
		});

		it('strips Authorization header from error.request', () => {
			const err = {
				request: {
					headers: {
						Authorization: 'Bearer req-secret',
						'User-Agent': 'n8n',
					},
				},
			};
			const sanitized = sanitizeError(err);
			const headers = (sanitized.request as Record<string, unknown>)
				?.headers as Record<string, unknown>;
			expect(headers?.Authorization).toBeUndefined();
			expect(headers?.['User-Agent']).toBe('n8n');
		});
	});

	describe('edge cases', () => {
		it('handles errors without config gracefully', () => {
			const err = { message: 'Network error' };
			expect(() => sanitizeError(err)).not.toThrow();
			const result = sanitizeError(err);
			expect(result.message).toBe('Network error');
		});

		it('handles null gracefully', () => {
			expect(() => sanitizeError(null)).not.toThrow();
		});

		it('handles undefined gracefully', () => {
			expect(() => sanitizeError(undefined)).not.toThrow();
		});

		it('handles string errors gracefully', () => {
			expect(() => sanitizeError('some error string')).not.toThrow();
		});

		it('does not mutate the original error', () => {
			const original = {
				config: { headers: { Authorization: 'Bearer mutate-test' } },
			};
			sanitizeError(original);
			// Original should be untouched (we spread, not mutate)
			expect(original.config.headers.Authorization).toBe('Bearer mutate-test');
		});

		it('preserves non-header config fields', () => {
			const err = {
				config: {
					url: 'https://api.useapi.net/v1/midjourney/imagine',
					method: 'POST',
					headers: { Authorization: 'Bearer remove-me' },
				},
			};
			const sanitized = sanitizeError(err);
			const config = sanitized.config as Record<string, unknown>;
			expect(config.url).toBe('https://api.useapi.net/v1/midjourney/imagine');
			expect(config.method).toBe('POST');
		});

		it('handles config without headers object', () => {
			const err = { config: { url: 'https://example.com', timeout: 5000 } };
			expect(() => sanitizeError(err)).not.toThrow();
			const result = sanitizeError(err);
			const config = result.config as Record<string, unknown>;
			expect(config.url).toBe('https://example.com');
		});

		it('handles request object without headers', () => {
			const err = { request: { method: 'GET' } };
			expect(() => sanitizeError(err)).not.toThrow();
			const result = sanitizeError(err);
			const req = result.request as Record<string, unknown>;
			expect(req.method).toBe('GET');
		});
	});
});
