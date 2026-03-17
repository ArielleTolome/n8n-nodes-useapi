/**
 * Integration tests — require a real useapi.net API token.
 * Run with: USEAPI_TOKEN=your_token npm test -- --testPathPattern=integration
 *
 * These tests are SKIPPED by default (no credentials in CI).
 *
 * When you have a test account, replace the empty test bodies below with
 * real HTTP calls and assert on the response shape.
 */

const apiToken = process.env.USEAPI_TOKEN;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const runIntegration = !!apiToken;

const BASE_URL = process.env.USEAPI_BASE_URL ?? 'https://api.useapi.net/v1';

describe.skip('UseAPI Integration — Midjourney', () => {
	it('should submit an imagine job', async () => {
		// Example:
		//
		// const response = await fetch(`${BASE_URL}/midjourney/jobs/imagine`, {
		//   method: 'POST',
		//   headers: {
		//     'Authorization': `Bearer ${apiToken}`,
		//     'Content-Type': 'application/json',
		//   },
		//   body: JSON.stringify({ prompt: 'a red fox in a snowy forest' }),
		// });
		// const data = await response.json();
		// expect(data.jobid).toBeDefined();
	});

	it('should list recent jobs', async () => {
		// Example:
		//
		// const response = await fetch(`${BASE_URL}/midjourney/jobs/`, {
		//   headers: { 'Authorization': `Bearer ${apiToken}` },
		// });
		// const data = await response.json();
		// expect(Array.isArray(data.jobs)).toBe(true);
	});
});

describe.skip('UseAPI Integration — Dreamina', () => {
	it('should submit a generateImage job', async () => {
		// Not implemented — add when you have a test account
	});
});
