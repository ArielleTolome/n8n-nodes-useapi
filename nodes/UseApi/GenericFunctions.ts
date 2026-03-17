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
 * Strips Authorization headers from error objects before surfacing them via NodeApiError.
 * Prevents API tokens from leaking into n8n execution logs and the UI error display.
 */
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

	// axios-style errors include config.headers
	if (err.config && typeof err.config === 'object') {
		err.config = stripAuth(err.config as Record<string, unknown>);
	}
	// request-promise-style errors include options.headers
	if (err.options && typeof err.options === 'object') {
		err.options = stripAuth(err.options as Record<string, unknown>);
	}
	// Some wrappers nest under request
	if (err.request && typeof err.request === 'object') {
		const req = err.request as Record<string, unknown>;
		if (req.headers) {
			err.request = stripAuth(req);
		}
	}
	return err as JsonObject;
}

/**
 * Posts a binary file to the useapi.net API using raw binary body.
 * Used for endpoints that accept file uploads (MiniMax /files, TemPolor /midi, etc.)
 *
 * @param endpoint - API endpoint path (e.g. "/minimax/files/")
 * @param binaryPropertyName - n8n binary property name (e.g. "data")
 * @param i - Item index
 * @param qs - Query string parameters (e.g. { account: "...", name: "..." })
 * @returns The parsed JSON response from the API
 */
export async function useApiBinaryUpload(
	this: IExecuteFunctions,
	endpoint: string,
	binaryPropertyName: string,
	i: number,
	qs: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('useApiCredentials');
	const baseUrl = credentials.baseUrl as string;

	const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	// Build query string
	const qsPairs = Object.entries(qs).filter(([, v]) => v !== undefined && v !== '' && v !== null);
	const qsSuffix = qsPairs.length > 0
		? '?' + qsPairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
		: '';

	try {
		return (await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}${endpoint}${qsSuffix}`,
			headers: {
				Authorization: `Bearer ${credentials.apiToken}`,
				'Content-Type': binaryData.mimeType || 'application/octet-stream',
			},
			body: buffer,
		})) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), sanitizeError(error));
	}
}

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
): Promise<IDataObject> {
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
		throw new NodeApiError(this.getNode(), sanitizeError(error));
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
): Promise<IDataObject> {
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
