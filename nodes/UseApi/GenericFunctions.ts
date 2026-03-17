import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Makes an authenticated request to the useapi.net API.
 *
 * @param method - HTTP method (GET, POST, DELETE, etc.)
 * @param endpoint - API endpoint path (e.g. "/midjourney/jobs/imagine")
 * @param body - Optional request body for POST/PUT requests
 * @param qs - Optional query string parameters
 * @returns The parsed JSON response from the API
 */
export async function useApiRequest(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('useApiCredentials');
	const baseUrl = credentials.baseUrl as string;

	const options: IRequestOptions = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${credentials.apiToken}`,
			'Content-Type': 'application/json',
		},
		qs,
		body,
		json: true,
	};

	if (method === 'GET' || Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Polls a job endpoint until the job reaches a terminal status ("completed" or "failed").
 *
 * @param getEndpoint - The full endpoint path to poll (e.g. "/midjourney/jobs/abc123")
 * @param statusPath - The key in the response object that holds the status value (default: "status")
 * @param intervalMs - Polling interval in milliseconds (default: 3000)
 * @param maxWaitMs - Maximum wait time before timeout in milliseconds (default: 300000 = 5 minutes)
 * @returns The final response object when status is "completed"
 * @throws NodeApiError if the job fails or polling times out
 */
export async function waitForJob(
	this: IExecuteFunctions,
	getEndpoint: string,
	statusPath: string = 'status',
	intervalMs: number = 3000,
	maxWaitMs: number = 300000,
): Promise<any> {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWaitMs) {
		const response = await useApiRequest.call(this, 'GET', getEndpoint);
		const status = response[statusPath];

		if (status === 'completed') {
			return response;
		}

		if (status === 'failed' || status === 'error') {
			throw new NodeApiError(this.getNode(), response as JsonObject, {
				message: `Job failed: ${response.error || response.message || 'Unknown error'}`,
			});
		}

		await sleep(intervalMs);
	}

	throw new NodeApiError(this.getNode(), {} as JsonObject, {
		message: `Job polling timed out after ${maxWaitMs / 1000} seconds`,
	});
}

/**
 * Sleeps for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
