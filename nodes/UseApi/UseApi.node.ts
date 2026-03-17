import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { useApiRequest, waitForJob, useApiBinaryUpload } from './GenericFunctions';
import {
	resourceField,
	midjourneyOperations,
	midjourneyFields,
	dreaminaOperations,
	dreaminaFields,
	klingOperations,
	klingFields,
	runwayOperations,
	runwayFields,
	pixverseOperations,
	pixverseFields,
	minimaxOperations,
	minimaxFields,
	insightfaceswapOperations,
	insightfaceswapFields,
	googleFlowOperations,
	googleFlowFields,
	murekaOperations,
	murekaFields,
	temporlorOperations,
	temporlorFields,
} from './UseApiDescription';

export class UseApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'UseAPI',
		name: 'useApi',
		icon: 'file:useapi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Interact with AI services via useapi.net (Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap, Google Flow, Mureka, TemPolor)',
		defaults: { name: 'UseAPI' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'useApiCredentials',
				required: true,
			},
		],
		properties: [
			resourceField,
			// Operations
			midjourneyOperations,
			dreaminaOperations,
			klingOperations,
			runwayOperations,
			pixverseOperations,
			minimaxOperations,
			insightfaceswapOperations,
			googleFlowOperations,
			murekaOperations,
			temporlorOperations,
			// Fields
			...midjourneyFields,
			...dreaminaFields,
			...klingFields,
			...runwayFields,
			...pixverseFields,
			...minimaxFields,
			...insightfaceswapFields,
			...googleFlowFields,
			...murekaFields,
			...temporlorFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: any;

				switch (resource) {
					case 'midjourney':
						responseData = await executeMidjourney.call(this, operation, i);
						break;
					case 'dreamina':
						responseData = await executeDreamina.call(this, operation, i);
						break;
					case 'kling':
						responseData = await executeKling.call(this, operation, i);
						break;
					case 'runway':
						responseData = await executeRunway.call(this, operation, i);
						break;
					case 'pixverse':
						responseData = await executePixverse.call(this, operation, i);
						break;
					case 'minimax':
						responseData = await executeMinimax.call(this, operation, i);
						break;
					case 'insightfaceswap':
						responseData = await executeInsightfaceswap.call(this, operation, i);
						break;
					case 'googleFlow':
						responseData = await executeGoogleFlow.call(this, operation, i);
						break;
					case 'mureka':
						responseData = await executeMureka.call(this, operation, i);
						break;
					case 'tempolor':
						responseData = await executeTempolor.call(this, operation, i);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
							itemIndex: i,
						});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function addOptionalField(
	ctx: IExecuteFunctions,
	body: Record<string, any>,
	paramName: string,
	i: number,
	bodyKey?: string,
): void {
	const value = ctx.getNodeParameter(paramName, i, '') as string;
	if (value) {
		body[bodyKey || paramName] = value;
	}
}

function addOptionalNumber(
	ctx: IExecuteFunctions,
	body: Record<string, any>,
	paramName: string,
	i: number,
	bodyKey?: string,
): void {
	const value = ctx.getNodeParameter(paramName, i, 0) as number;
	if (value) {
		body[bodyKey || paramName] = value;
	}
}

function addOptionalBool(
	ctx: IExecuteFunctions,
	body: Record<string, any>,
	paramName: string,
	i: number,
	bodyKey?: string,
): void {
	const value = ctx.getNodeParameter(paramName, i, false) as boolean;
	if (value) {
		body[bodyKey || paramName] = value;
	}
}

/**
 * POST to a Runway-specific endpoint and poll /tasks/{taskId} until SUCCEEDED/FAILED.
 * Handles both flat { taskId: "..." } and nested { task: { taskId: "..." } } responses.
 */
async function runwayTaskPoll(
	ctx: IExecuteFunctions,
	i: number,
	endpoint: string,
	body: Record<string, any>,
	basePath: string,
): Promise<any> {
	const asyncMode = ctx.getNodeParameter('asyncMode', i, false) as boolean;
	if (asyncMode) body.async = true;
	const response = await useApiRequest.call(ctx, 'POST', endpoint, body);
	const wait = ctx.getNodeParameter('waitForCompletion', i, true) as boolean;
	if (!wait) return response;
	const taskId = (response.taskId || response.task?.taskId) as string | undefined;
	if (!taskId) return response;
	const pollEndpoint = `${basePath}/tasks/${taskId}`;
	const startTime = Date.now();
	const intervalMs = 3000;
	const maxWaitMs = 300000;
	while (Date.now() - startTime < maxWaitMs) {
		const poll = await useApiRequest.call(ctx, 'GET', pollEndpoint);
		const status = (poll.status || poll.task?.status || '') as string;
		if (status === 'SUCCEEDED' || status === 'completed') return poll;
		if (status === 'FAILED' || status === 'failed' || status === 'error') {
			const errMsg = JSON.stringify(poll.error || poll.task?.error || 'Task failed');
			throw new NodeOperationError(ctx.getNode(), `Runway task failed: ${errMsg}`);
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	throw new NodeOperationError(ctx.getNode(), 'Runway task polling timed out after 5 minutes');
}

async function postAndMaybePoll(
	ctx: IExecuteFunctions,
	i: number,
	postEndpoint: string,
	body: Record<string, any>,
	pollEndpointPrefix: string,
	idField: string = 'jobid',
): Promise<any> {
	const asyncMode = ctx.getNodeParameter('asyncMode', i, false) as boolean;
	if (asyncMode) body.async = true;
	const response = await useApiRequest.call(ctx, 'POST', postEndpoint, body);
	const wait = ctx.getNodeParameter('waitForCompletion', i, true) as boolean;
	const id = response[idField];
	if (wait && id) {
		return await waitForJob.call(ctx, `${pollEndpointPrefix}/${id}`);
	}
	return response;
}

// ──────────────────────────────────────────────────────────────
// Midjourney
// ──────────────────────────────────────────────────────────────

async function executeMidjourney(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/midjourney';

	if (operation === 'imagine') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'sref', i);
		addOptionalField(this, body, 'cref', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/imagine`, body, `${basePath}/jobs`);
	}

	if (operation === 'button') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
			button: this.getNodeParameter('button', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/button`, body, `${basePath}/jobs`);
	}

	if (operation === 'describe') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'url', i, 'imageUrl');
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/describe`, body, `${basePath}/jobs`);
	}

	if (operation === 'blend') {
		const blendUrlsStr = this.getNodeParameter('blendUrls', i) as string;
		const blendUrls = blendUrlsStr.split(',').map((u) => u.trim()).filter(Boolean);
		const body: Record<string, any> = { blendUrls };
		const dimensions = this.getNodeParameter('dimensions', i, 'Square') as string;
		if (dimensions) body.dimensions = dimensions;
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/blend`, body, `${basePath}/jobs`);
	}

	if (operation === 'seed') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/seed`, body, `${basePath}/jobs`);
	}

	if (operation === 'settings') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'account', i);
		const payload = this.getNodeParameter('payload', i, '{}') as string;
		if (payload && payload !== '{}') {
			try {
				body.payload = JSON.parse(payload);
			} catch {
				body.payload = payload;
			}
		}
		return await useApiRequest.call(this, 'POST', `${basePath}/jobs/settings`, body);
	}

	if (operation === 'remix') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
			prompt: this.getNodeParameter('prompt', i) as string,
			button: this.getNodeParameter('button', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/remix`, body, `${basePath}/jobs`);
	}

	if (operation === 'variability') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/variability`, body, `${basePath}/jobs`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/jobs/${jobid}`);
	}

	if (operation === 'listJobs') {
		const qs: Record<string, any> = {};
		const account = this.getNodeParameter('account', i, '') as string;
		const status = this.getNodeParameter('status', i, '') as string;
		if (account) qs.account = account;
		if (status) qs.status = status;
		return await useApiRequest.call(this, 'GET', `${basePath}/jobs`, {}, qs);
	}

	if (operation === 'cancelJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/jobs/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Midjourney operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// Dreamina
// ──────────────────────────────────────────────────────────────

async function executeDreamina(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/dreamina';

	if (operation === 'generateImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			ratio: this.getNodeParameter('ratio', i) as string,
			resolution: this.getNodeParameter('resolution', i) as string,
		};
		addOptionalNumber(this, body, 'seed', i);
		addOptionalField(this, body, 'imageRef_1', i);
		addOptionalField(this, body, 'imageRef_2', i);
		addOptionalField(this, body, 'imageRef_3', i);
		addOptionalField(this, body, 'account', i);
		addOptionalBool(this, body, 'dreaminaImgAsync', i, 'async');
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/images`, body, `${basePath}/images`);
	}

	if (operation === 'generateVideo') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			ratio: this.getNodeParameter('ratio', i) as string,
			duration: this.getNodeParameter('duration', i) as number,
		};
		addOptionalField(this, body, 'firstFrameRef', i);
		addOptionalField(this, body, 'endFrameRef', i);
		addOptionalNumber(this, body, 'dreaminaVideoSeed', i, 'seed');
		addOptionalField(this, body, 'account', i);
		addOptionalBool(this, body, 'dreaminaVideoAsync', i, 'async');
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos`, body, `${basePath}/videos`);
	}

	if (operation === 'upscaleImage') {
		const body: Record<string, any> = {
			upscaleResolution: this.getNodeParameter('resolution', i) as string,
		};
		const imageJobId = this.getNodeParameter('imageJobId', i, '') as string;
		if (imageJobId) body.jobid = imageJobId;
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'drm_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'drm_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'drm_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images/upscale`, body, `${basePath}/images`);
	}

	if (operation === 'getImageJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/images/${jobid}`);
	}

	if (operation === 'getVideoJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'listAssets') {
		const account = this.getNodeParameter('account', i) as string;
		const qs: Record<string, any> = {};
		const count = this.getNodeParameter('count', i, 20) as number;
		const offset = this.getNodeParameter('offset', i, '') as string;
		if (count) qs.count = count;
		if (offset) qs.offset = offset;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets/${account}`, {}, qs);
	}

	if (operation === 'deleteAsset') {
		const assetId = this.getNodeParameter('assetId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/assets/${assetId}`);
	}

	if (operation === 'cancelJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/scheduler/${jobid}`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			email: this.getNodeParameter('email', i) as string,
			password: this.getNodeParameter('password', i) as string,
			region: this.getNodeParameter('region', i) as string,
		};
		addOptionalBool(this, body, 'dryRun', i);
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'getAccount') {
		const account = this.getNodeParameter('account', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${account}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'deleteAccount') {
		const account = this.getNodeParameter('account', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${account}`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Dreamina operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// Kling
// ──────────────────────────────────────────────────────────────

async function executeKling(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/kling';

	const klingPostAndPoll = async (
		postEndpoint: string,
		body: Record<string, any>,
	): Promise<any> => {
		const asyncMode = this.getNodeParameter('asyncMode', i, false) as boolean;
		if (asyncMode) body.async = true;
		const response = await useApiRequest.call(this, 'POST', postEndpoint, body);
		const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;
		const taskId = response.task_id || response.jobid;
		if (wait && taskId) {
			return await waitForJob.call(this, `${basePath}/tasks/${taskId}`);
		}
		return response;
	};

	if (operation === 'textToVideo') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			mode: this.getNodeParameter('mode', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
			duration: this.getNodeParameter('duration', i) as string,
		};
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalBool(this, body, 'enable_audio', i);
		addOptionalNumber(this, body, 'cfg_scale', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'klingT2VAsync', i, 'async');
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await klingPostAndPoll(`${basePath}/videos/text2video`, body);
	}

	if (operation === 'imageToVideo') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('image_url', i) as string,
			model: this.getNodeParameter('model', i) as string,
			mode: this.getNodeParameter('mode', i) as string,
			duration: this.getNodeParameter('duration', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalField(this, body, 'tail_image_url', i);
		addOptionalBool(this, body, 'enable_audio', i);
		addOptionalNumber(this, body, 'cfg_scale', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'klingI2VAsync', i, 'async');
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await klingPostAndPoll(`${basePath}/videos/omni`, body);
	}

	if (operation === 'imageToVideoEffects') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('image_url', i) as string,
			effect_id: this.getNodeParameter('effect_id', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/image2video-effects`, body);
	}

	if (operation === 'extendVideo') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/extend`, body);
	}

	if (operation === 'lipSync') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'audio_url', i);
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'voice_id', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/lipsync`, body);
	}

	if (operation === 'addSound') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/add-sound`, body);
	}

	if (operation === 'motionCreate') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('image_url', i) as string,
			motion_id: this.getNodeParameter('motion_id', i) as string,
			model: this.getNodeParameter('model', i) as string,
			duration: this.getNodeParameter('duration', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/motion-create`, body);
	}

	if (operation === 'textToImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
		};
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/images/kolors`, body);
	}

	if (operation === 'omniImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
			resolution: this.getNodeParameter('resolution', i) as string,
		};
		addOptionalField(this, body, 'image_url', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/images/omni`, body);
	}

	if (operation === 'virtualTryOn') {
		const body: Record<string, any> = {
			human_image_url: this.getNodeParameter('human_image_url', i) as string,
			cloth_image_url: this.getNodeParameter('cloth_image_url', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/images/virtual-try-on`, body);
	}

	if (operation === 'recognizeFaces') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('image_url', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await useApiRequest.call(this, 'POST', `${basePath}/images/recognize-faces`, body);
	}

	if (operation === 'upscaleImage') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await klingPostAndPoll(`${basePath}/images/upscale`, body);
	}

	if (operation === 'textToSpeech') {
		const body: Record<string, any> = {
			text: this.getNodeParameter('text', i) as string,
		};
		addOptionalField(this, body, 'voice_id', i);
		addOptionalField(this, body, 'account', i);
		return await klingPostAndPoll(`${basePath}/tts/create`, body);
	}

	if (operation === 'avatarVideo') {
		const body: Record<string, any> = {
			avatar_id: this.getNodeParameter('avatar_id', i) as string,
		};
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'audio_url', i);
		addOptionalField(this, body, 'voice_id', i);
		const mode = this.getNodeParameter('mode', i, 'std') as string;
		body.mode = mode;
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/avatars/video`, body);
	}

	if (operation === 'getTask') {
		const taskId = this.getNodeParameter('task_id', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/tasks/${taskId}`);
	}

	if (operation === 'listTasks') {
		const qs: Record<string, any> = {};
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.account = account;
		return await useApiRequest.call(this, 'GET', `${basePath}/tasks`, {}, qs);
	}

	if (operation === 'cancelTask') {
		const taskId = this.getNodeParameter('task_id', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/scheduler/${taskId}`);
	}

	if (operation === 'listEffects') {
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/effects`);
	}

	if (operation === 'listMotions') {
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/motions`);
	}

	if (operation === 'listAvatars') {
		return await useApiRequest.call(this, 'GET', `${basePath}/avatars`);
	}

	if (operation === 'listTtsVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/tts/voices`);
	}

	if (operation === 'uploadAsset') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('imageUrl', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await useApiRequest.call(this, 'POST', `${basePath}/assets`, body);
	}

	if (operation === 'listAssets') {
		const qs: Record<string, any> = {};
		const acct = this.getNodeParameter('klingAssetsAccount', i, '') as string;
		const offset = this.getNodeParameter('klingAssetsOffset', i, 0) as number;
		const limit = this.getNodeParameter('klingAssetsLimit', i, 20) as number;
		if (acct) qs.account = acct;
		if (offset) qs.offset = offset;
		if (limit) qs.limit = limit;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets`, {}, qs);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'omniVideo') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('omniVideoModel', i) as string,
		};
		const prompt = this.getNodeParameter('omniVideoPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		const dur = this.getNodeParameter('omniVideoDuration', i, '5') as string;
		if (dur) body.duration = dur;
		const ar = this.getNodeParameter('omniVideoAspectRatio', i, '16:9') as string;
		if (ar) body.aspect_ratio = ar;
		const imgUrl = this.getNodeParameter('omniVideoImageUrl', i, '') as string;
		if (imgUrl) body.image_url = imgUrl;
		const negPrompt = this.getNodeParameter('omniVideoNegativePrompt', i, '') as string;
		if (negPrompt) body.negative_prompt = negPrompt;
		const cfg = this.getNodeParameter('omniVideoCfg', i, 0) as number;
		if (cfg) body.cfg = cfg;
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/omni`, body);
	}

	if (operation === 'image2videoFrames') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('i2vFramesModel', i) as string,
			image: this.getNodeParameter('firstFrameUrl', i) as string,
			image_tail: this.getNodeParameter('lastFrameUrl', i) as string,
		};
		const prompt = this.getNodeParameter('i2vFramesPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		const dur = this.getNodeParameter('i2vFramesDuration', i, '5') as string;
		if (dur) body.duration = dur;
		const cfg = this.getNodeParameter('i2vFramesCfg', i, 0) as number;
		if (cfg) body.cfg = cfg;
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/image2video-frames`, body);
	}

	if (operation === 'image2videoElements') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('i2vElementsModel', i) as string,
			image_url: this.getNodeParameter('i2vElementsImageUrl', i) as string,
		};
		const elemData = this.getNodeParameter('elementIds', i, {}) as { items?: Array<{ id: string }> };
		const elementIds = elemData.items?.map((item) => item.id).filter(Boolean) || [];
		if (elementIds.length > 0) body.element_ids = elementIds;
		const prompt = this.getNodeParameter('i2vElementsPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		const dur = this.getNodeParameter('i2vElementsDuration', i, '5') as string;
		if (dur) body.duration = dur;
		const ar = this.getNodeParameter('i2vElementsAspectRatio', i, '16:9') as string;
		if (ar) body.aspect_ratio = ar;
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/videos/image2video-elements`, body);
	}

	if (operation === 'kolorsElements') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('kolorsElemModel', i) as string,
			prompt: this.getNodeParameter('kolorsElemPrompt', i) as string,
		};
		const elemData = this.getNodeParameter('kolorsElementIds', i, {}) as { items?: Array<{ id: string }> };
		const elementIds = elemData.items?.map((item) => item.id).filter(Boolean) || [];
		if (elementIds.length > 0) body.element_ids = elementIds;
		const negPrompt = this.getNodeParameter('kolorsElemNegativePrompt', i, '') as string;
		if (negPrompt) body.negative_prompt = negPrompt;
		const ar = this.getNodeParameter('kolorsElemAspectRatio', i, '16:9') as string;
		if (ar) body.aspect_ratio = ar;
		const cfg = this.getNodeParameter('kolorsElemCfg', i, 0) as number;
		if (cfg) body.cfg = cfg;
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'klingSeed', i, 'seed');
		addOptionalField(this, body, 'kling_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'kling_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'kling_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'kling_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'kling_captchaOrder', i, 'captchaOrder');
		return await klingPostAndPoll(`${basePath}/images/kolors-elements`, body);
	}

	if (operation === 'listElements') {
		return await useApiRequest.call(this, 'GET', `${basePath}/elements`);
	}

	if (operation === 'listElementTags') {
		return await useApiRequest.call(this, 'GET', `${basePath}/elements/tags`);
	}

	if (operation === 'listElementVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/elements/voices`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			email: this.getNodeParameter('klingAccountEmail', i) as string,
			password: this.getNodeParameter('klingAccountPassword', i) as string,
		};
		const maxJobs = this.getNodeParameter('klingAccountMaxJobs', i, 10) as number;
		if (maxJobs) body.maxJobs = maxJobs;
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'getAccount') {
		const email = this.getNodeParameter('klingAccountEmailGet', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${email}`);
	}

	if (operation === 'deleteAccount') {
		const email = this.getNodeParameter('klingAccountEmailGet', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${email}`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Kling operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// Runway
// ──────────────────────────────────────────────────────────────

async function executeRunway(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/runwayml';

	if (operation === 'createVideo') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('model', i) as string,
		};
		const textPrompt = this.getNodeParameter('prompt', i) as string;
		if (textPrompt) body.text_prompt = textPrompt;
		const aspectRatio = this.getNodeParameter('ratio', i) as string;
		if (aspectRatio) body.aspect_ratio = aspectRatio;
		const duration = this.getNodeParameter('duration', i) as number;
		if (duration) body.duration = duration;
		addOptionalField(this, body, 'resolution', i);
		addOptionalField(this, body, 'imageAssetId1', i);
		addOptionalField(this, body, 'imageAssetId2', i);
		addOptionalField(this, body, 'videoAssetId', i);
		// audio: always send when false to explicitly disable (default is true)
		body.audio = this.getNodeParameter('audio', i, true) as boolean;
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'exploreMode', i);
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalField(this, body, 'account', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/create`, body, `${basePath}/videos`);
	}

	if (operation === 'createImage') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('model', i) as string,
			aspect_ratio: this.getNodeParameter('ratio', i) as string,
		};
		// text_prompt is required for gpt-image-1-5 and gpt-image-1-mini, optional for others
		const textPrompt = this.getNodeParameter('prompt', i) as string;
		if (textPrompt) body.text_prompt = textPrompt;
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'exploreMode', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/images`);
	}

	if (operation === 'lipSync') {
		const body: Record<string, any> = {
			video_url: this.getNodeParameter('video_url', i) as string,
		};
		addOptionalField(this, body, 'audio_url', i);
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/lipsync/create`, body, `${basePath}/videos`);
	}

	if (operation === 'actTwo') {
		const body: Record<string, any> = {
			video_url: this.getNodeParameter('video_url', i) as string,
			reference_url: this.getNodeParameter('reference_url', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/gen4/act-two`, body, `${basePath}/videos`);
	}

	if (operation === 'frames') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
		};
		addOptionalField(this, body, 'image_url', i);
		addOptionalField(this, body, 'last_frame_url', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/frames/create`, body, `${basePath}/videos`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	// ── Gen-4.5 Create ───────────────────────────────────────────
	if (operation === 'gen4_5Create') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'text_prompt', i);
		addOptionalField(this, body, 'firstImage_assetId', i);
		addOptionalField(this, body, 'lastImage_assetId', i);
		addOptionalField(this, body, 'aspect_ratio', i);
		const secs = this.getNodeParameter('seconds', i, 5) as number;
		if (secs) body.seconds = secs;
		addOptionalNumber(this, body, 'gen4Seed', i, 'seed');
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4_5/create`, body, basePath);
	}

	// ── Gen-4 Turbo Create ───────────────────────────────────────
	if (operation === 'gen4TurboCreate') {
		const body: Record<string, any> = {
			firstImage_assetId: this.getNodeParameter('firstImage_assetId', i) as string,
		};
		addOptionalField(this, body, 'text_prompt', i);
		addOptionalField(this, body, 'aspect_ratio', i);
		const secs = this.getNodeParameter('seconds', i, 5) as number;
		if (secs) body.seconds = secs;
		addOptionalNumber(this, body, 'gen4Seed', i, 'seed');
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4turbo/create`, body, basePath);
	}

	// ── Gen-4 Create ─────────────────────────────────────────────
	if (operation === 'gen4Create') {
		const body: Record<string, any> = {
			firstImage_assetId: this.getNodeParameter('firstImage_assetId', i) as string,
		};
		addOptionalField(this, body, 'lastImage_assetId', i);
		addOptionalField(this, body, 'text_prompt', i);
		addOptionalField(this, body, 'aspect_ratio', i);
		const secs = this.getNodeParameter('seconds', i, 5) as number;
		if (secs) body.seconds = secs;
		addOptionalNumber(this, body, 'gen4Seed', i, 'seed');
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4/create`, body, basePath);
	}

	// ── Gen-4 Upscale 4K ─────────────────────────────────────────
	if (operation === 'gen4Upscale') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('upscaleAssetId', i) as string,
		};
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4/upscale`, body, basePath);
	}

	// ── Gen-4 Aleph (Video-to-Video) ─────────────────────────────
	if (operation === 'gen4Video') {
		const body: Record<string, any> = {
			video_assetId: this.getNodeParameter('video_assetId', i) as string,
			text_prompt: this.getNodeParameter('text_prompt', i) as string,
		};
		addOptionalField(this, body, 'image_assetId', i);
		addOptionalNumber(this, body, 'gen4Seed', i, 'seed');
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4/video`, body, basePath);
	}

	// ── Act Two Voice ────────────────────────────────────────────
	if (operation === 'actTwoVoice') {
		const body: Record<string, any> = {
			video_assetId: this.getNodeParameter('video_assetId', i) as string,
			voiceId: this.getNodeParameter('voiceId', i) as string,
		};
		addOptionalBool(this, body, 'gen4ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen4/act-two-voice`, body, basePath);
	}

	// ── Gen-3 Turbo Create ───────────────────────────────────────
	if (operation === 'gen3TurboCreate') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'g3FirstImage_assetId', i, 'firstImage_assetId');
		addOptionalField(this, body, 'g3MiddleImage_assetId', i, 'middleImage_assetId');
		addOptionalField(this, body, 'g3LastImage_assetId', i, 'lastImage_assetId');
		addOptionalField(this, body, 'g3TextPrompt', i, 'text_prompt');
		addOptionalField(this, body, 'g3AspectRatio', i, 'aspect_ratio');
		const g3Secs = this.getNodeParameter('g3Seconds', i, 5) as number;
		if (g3Secs) body.seconds = g3Secs;
		const g3Horiz = this.getNodeParameter('g3Horizontal', i, 0) as number;
		if (g3Horiz) body.horizontal = g3Horiz;
		const g3Vert = this.getNodeParameter('g3Vertical', i, 0) as number;
		if (g3Vert) body.vertical = g3Vert;
		const g3Zoom = this.getNodeParameter('g3Zoom', i, 0) as number;
		if (g3Zoom) body.zoom = g3Zoom;
		const g3Roll = this.getNodeParameter('g3Roll', i, 0) as number;
		if (g3Roll) body.roll = g3Roll;
		const g3Pan = this.getNodeParameter('g3Pan', i, 0) as number;
		if (g3Pan) body.pan = g3Pan;
		const g3Tilt = this.getNodeParameter('g3Tilt', i, 0) as number;
		if (g3Tilt) body.tilt = g3Tilt;
		addOptionalBool(this, body, 'g3Static', i, 'static');
		addOptionalNumber(this, body, 'g3Seed', i, 'seed');
		addOptionalBool(this, body, 'g3ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3turbo/create`, body, basePath);
	}

	// ── Gen-3 Create ─────────────────────────────────────────────
	if (operation === 'gen3Create') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'g3FirstImage_assetId', i, 'firstImage_assetId');
		addOptionalField(this, body, 'g3MiddleImage_assetId', i, 'middleImage_assetId');
		addOptionalField(this, body, 'g3LastImage_assetId', i, 'lastImage_assetId');
		addOptionalField(this, body, 'g3TextPrompt', i, 'text_prompt');
		addOptionalField(this, body, 'g3AspectRatio', i, 'aspect_ratio');
		const g3Secs = this.getNodeParameter('g3Seconds', i, 5) as number;
		if (g3Secs) body.seconds = g3Secs;
		const g3Horiz = this.getNodeParameter('g3Horizontal', i, 0) as number;
		if (g3Horiz) body.horizontal = g3Horiz;
		const g3Vert = this.getNodeParameter('g3Vertical', i, 0) as number;
		if (g3Vert) body.vertical = g3Vert;
		const g3Zoom = this.getNodeParameter('g3Zoom', i, 0) as number;
		if (g3Zoom) body.zoom = g3Zoom;
		const g3Roll = this.getNodeParameter('g3Roll', i, 0) as number;
		if (g3Roll) body.roll = g3Roll;
		const g3Pan = this.getNodeParameter('g3Pan', i, 0) as number;
		if (g3Pan) body.pan = g3Pan;
		const g3Tilt = this.getNodeParameter('g3Tilt', i, 0) as number;
		if (g3Tilt) body.tilt = g3Tilt;
		addOptionalBool(this, body, 'g3Static', i, 'static');
		addOptionalNumber(this, body, 'g3Seed', i, 'seed');
		addOptionalBool(this, body, 'g3ExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3/create`, body, basePath);
	}

	// ── Gen-3 Turbo Video ────────────────────────────────────────
	if (operation === 'gen3TurboVideo') {
		const body: Record<string, any> = {
			video_assetId: this.getNodeParameter('g3vVideoAssetId', i) as string,
		};
		addOptionalField(this, body, 'g3vTextPrompt', i, 'text_prompt');
		const g3vSecs = this.getNodeParameter('g3vSeconds', i, 5) as number;
		if (g3vSecs) body.seconds = g3vSecs;
		addOptionalNumber(this, body, 'g3vSeed', i, 'seed');
		addOptionalBool(this, body, 'g3vExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3turbo/video`, body, basePath);
	}

	// ── Gen-3 Video ──────────────────────────────────────────────
	if (operation === 'gen3Video') {
		const body: Record<string, any> = {
			video_assetId: this.getNodeParameter('g3vVideoAssetId', i) as string,
		};
		addOptionalField(this, body, 'g3vTextPrompt', i, 'text_prompt');
		const g3vSecs = this.getNodeParameter('g3vSeconds', i, 5) as number;
		if (g3vSecs) body.seconds = g3vSecs;
		addOptionalNumber(this, body, 'g3vSeed', i, 'seed');
		addOptionalBool(this, body, 'g3vExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3/video`, body, basePath);
	}

	// ── Gen-3 Turbo Extend ───────────────────────────────────────
	if (operation === 'gen3TurboExtend') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('extendAssetId', i) as string,
		};
		addOptionalField(this, body, 'extendTextPrompt', i, 'text_prompt');
		addOptionalNumber(this, body, 'extendSeed', i, 'seed');
		addOptionalBool(this, body, 'extendExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3turbo/extend`, body, basePath);
	}

	// ── Gen-3 Extend ─────────────────────────────────────────────
	if (operation === 'gen3Extend') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('extendAssetId', i) as string,
		};
		addOptionalField(this, body, 'extendTextPrompt', i, 'text_prompt');
		addOptionalNumber(this, body, 'extendSeed', i, 'seed');
		addOptionalBool(this, body, 'extendExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3/extend`, body, basePath);
	}

	// ── Gen-3 Turbo Expand ───────────────────────────────────────
	if (operation === 'gen3TurboExpand') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('expandAssetId', i) as string,
		};
		addOptionalBool(this, body, 'expandExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3turbo/expand`, body, basePath);
	}

	// ── Gen-3 Turbo Act One ──────────────────────────────────────
	if (operation === 'gen3TurboActOne') {
		const body: Record<string, any> = {
			driving_assetId: this.getNodeParameter('driving_assetId', i) as string,
			character_assetId: this.getNodeParameter('character_assetId', i) as string,
		};
		addOptionalNumber(this, body, 'motion_multiplier', i);
		addOptionalField(this, body, 'actOneAspectRatio', i, 'aspect_ratio');
		addOptionalBool(this, body, 'actOneExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3turbo/actone`, body, basePath);
	}

	// ── Gen-3 Act One ────────────────────────────────────────────
	if (operation === 'gen3ActOne') {
		const body: Record<string, any> = {
			driving_assetId: this.getNodeParameter('driving_assetId', i) as string,
			character_assetId: this.getNodeParameter('character_assetId', i) as string,
		};
		addOptionalNumber(this, body, 'motion_multiplier', i);
		addOptionalField(this, body, 'actOneAspectRatio', i, 'aspect_ratio');
		addOptionalBool(this, body, 'actOneExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3/actone`, body, basePath);
	}

	// ── Gen-3 Alpha Upscale 4K ───────────────────────────────────
	if (operation === 'gen3AlphaUpscale') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('alphaUpscaleAssetId', i) as string,
		};
		addOptionalBool(this, body, 'alphaUpscaleExploreMode', i, 'exploreMode');
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/gen3alpha/upscale`, body, basePath);
	}

	// ── Super Slow Motion ────────────────────────────────────────
	if (operation === 'superSlowMotion') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('ssmAssetId', i) as string,
			speed: this.getNodeParameter('ssmSpeed', i) as number,
		};
		const fmt = this.getNodeParameter('ssmFormat', i, 'mp4') as string;
		if (fmt && fmt !== 'mp4') body.format = fmt;
		addOptionalField(this, body, 'runwayEmail', i, 'email');
		addOptionalField(this, body, 'runway_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'runway_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'runway_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'runway_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'runway_captchaOrder', i, 'captchaOrder');
		return await runwayTaskPoll(this, i, `${basePath}/super_slow_motion`, body, basePath);
	}

	// ── Describe Frames ──────────────────────────────────────────
	if (operation === 'describeFrames') {
		const qs: Record<string, any> = {
			taskId: this.getNodeParameter('describeTaskId', i) as string,
		};
		return await useApiRequest.call(this, 'GET', `${basePath}/frames/describe`, {}, qs);
	}

	// ── List LipSync Voices ──────────────────────────────────────
	if (operation === 'listVoices') {
		const qs: Record<string, any> = {};
		const email = this.getNodeParameter('voicesEmail', i, '') as string;
		if (email) qs.email = email;
		return await useApiRequest.call(this, 'GET', `${basePath}/lipsync/voices`, {}, qs);
	}

	// ── Image Upscaler ───────────────────────────────────────────
	if (operation === 'imageUpscaler') {
		const qs: Record<string, any> = {
			image_url: this.getNodeParameter('upscalerImageUrl', i) as string,
			width: this.getNodeParameter('upscalerWidth', i) as number,
			height: this.getNodeParameter('upscalerHeight', i) as number,
		};
		const email = this.getNodeParameter('upscalerEmail', i, '') as string;
		if (email) qs.email = email;
		return await useApiRequest.call(this, 'GET', `${basePath}/image_upscaler`, {}, qs);
	}

	// ── Transcribe ───────────────────────────────────────────────
	if (operation === 'transcribe') {
		const qs: Record<string, any> = {
			assetId: this.getNodeParameter('transcribeAssetId', i) as string,
			language: this.getNodeParameter('transcribeLanguage', i) as string,
		};
		return await useApiRequest.call(this, 'GET', `${basePath}/transcribe`, {}, qs);
	}

	// ── List Assets ──────────────────────────────────────────────
	if (operation === 'listAssets') {
		const qs: Record<string, any> = {};
		const mediaType = this.getNodeParameter('assetsMediaType', i, '') as string;
		if (mediaType) qs.mediaType = mediaType;
		const offset = this.getNodeParameter('assetsOffset', i, 0) as number;
		if (offset) qs.offset = offset;
		const limit = this.getNodeParameter('assetsLimit', i, 10) as number;
		if (limit) qs.limit = limit;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets`, {}, qs);
	}

	// ── Get Asset ────────────────────────────────────────────────
	if (operation === 'getAsset') {
		const assetId = this.getNodeParameter('singleAssetId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets/${assetId}`);
	}

	// ── Delete Asset ─────────────────────────────────────────────
	if (operation === 'deleteAsset') {
		const assetId = this.getNodeParameter('singleAssetId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/assets/${assetId}`);
	}

	// ── List Tasks ───────────────────────────────────────────────
	if (operation === 'listTasks') {
		const qs: Record<string, any> = {};
		const offset = this.getNodeParameter('tasksOffset', i, 0) as number;
		if (offset) qs.offset = offset;
		const limit = this.getNodeParameter('tasksLimit', i, 10) as number;
		if (limit) qs.limit = limit;
		return await useApiRequest.call(this, 'GET', `${basePath}/tasks`, {}, qs);
	}

	// ── Get Task ─────────────────────────────────────────────────
	if (operation === 'getTask') {
		const taskId = this.getNodeParameter('singleTaskId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/tasks/${taskId}`);
	}

	// ── Delete Task ──────────────────────────────────────────────
	if (operation === 'deleteTask') {
		const taskId = this.getNodeParameter('singleTaskId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/tasks/${taskId}`);
	}

	// ── Get Scheduler ────────────────────────────────────────────
	if (operation === 'getScheduler') {
		return await useApiRequest.call(this, 'GET', `${basePath}/scheduler`);
	}

	// ── Delete Scheduler Task ────────────────────────────────────
	if (operation === 'deleteSchedulerTask') {
		const taskId = this.getNodeParameter('schedulerTaskId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/scheduler/${taskId}`);
	}

	// ── Get Features ─────────────────────────────────────────────
	if (operation === 'getFeatures') {
		const qs: Record<string, any> = {};
		const email = this.getNodeParameter('featuresEmail', i, '') as string;
		if (email) qs.email = email;
		return await useApiRequest.call(this, 'GET', `${basePath}/features`, {}, qs);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Runway operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// PixVerse
// ──────────────────────────────────────────────────────────────

async function executePixverse(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/pixverse';

	if (operation === 'createVideo') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
			duration: this.getNodeParameter('duration', i) as number,
			quality: this.getNodeParameter('quality', i) as string,
		};
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalNumber(this, body, 'seed', i);
		addOptionalField(this, body, 'image_url', i);
		addOptionalField(this, body, 'end_image_url', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/create-v4`, body, `${basePath}/videos`);
	}

	if (operation === 'createImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
		};
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'pvCreateImageSeed', i, 'seed');
		addOptionalField(this, body, 'pvc_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvc_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvc_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/videos`);
	}

	if (operation === 'extendVideo') {
		const body: Record<string, any> = {
			video_id: this.getNodeParameter('videoId', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'pvExtendSeed', i, 'seed');
		addOptionalField(this, body, 'pve_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pve_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pve_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/extend`, body, `${basePath}/videos`);
	}

	if (operation === 'upscaleVideo') {
		const body: Record<string, any> = {
			video_id: this.getNodeParameter('videoId', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'pvu_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvu_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvu_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/upscale`, body, `${basePath}/videos`);
	}

	if (operation === 'createFrames') {
		const imageUrlsData = this.getNodeParameter('imageUrls', i, {}) as { items?: Array<{ url: string }> };
		const imageUrls = imageUrlsData.items?.map((item) => item.url).filter(Boolean) || [];
		const body: Record<string, any> = {
			imageUrls,
			model: this.getNodeParameter('model', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		const duration = this.getNodeParameter('duration', i, 5) as number;
		if (duration) body.duration = duration;
		addOptionalField(this, body, 'resolution', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'pvFramesSeed', i, 'seed');
		addOptionalField(this, body, 'pvf_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvf_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvf_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/create-frames`, body, `${basePath}/videos`);
	}

	if (operation === 'lipSyncVideo') {
		const body: Record<string, any> = {
			video_id: this.getNodeParameter('videoId', i) as string,
		};
		addOptionalField(this, body, 'audioUrl', i, 'audio_path');
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'voiceId', i, 'speaker_id');
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'pvl_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvl_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvl_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/lipsync`, body, `${basePath}/videos`);
	}

	if (operation === 'modifyVideo') {
		const body: Record<string, any> = {
			video_id: this.getNodeParameter('videoId', i) as string,
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'model', i);
		addOptionalField(this, body, 'pvm_negative_prompt', i, 'negative_prompt');
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'pvModifySeed', i, 'seed');
		addOptionalField(this, body, 'pvm_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvm_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvm_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/modify`, body, `${basePath}/videos`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'createFusion') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('pvFusionModel', i) as string,
			frame_1_path: this.getNodeParameter('pvVideoUrl1', i) as string,
			frame_2_path: this.getNodeParameter('pvVideoUrl2', i) as string,
		};
		const prompt = this.getNodeParameter('pvFusionPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		const dur = this.getNodeParameter('pvFusionDuration', i, '5') as string;
		if (dur) body.duration = dur;
		const res = this.getNodeParameter('pvFusionResolution', i, '720p') as string;
		if (res) body.resolution = res;
		addOptionalNumber(this, body, 'pvFusionSeed', i, 'seed');
		addOptionalField(this, body, 'pvfu_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvfu_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvfu_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/create-fusion`, body, `${basePath}/videos`);
	}

	if (operation === 'createTransition') {
		const body: Record<string, any> = {
			model: this.getNodeParameter('pvTransitionModel', i) as string,
			frame_1_path: this.getNodeParameter('pvTransitionStartUrl', i) as string,
			frame_2_path: this.getNodeParameter('pvTransitionEndUrl', i) as string,
		};
		const prompt = this.getNodeParameter('pvTransitionPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		const dur = this.getNodeParameter('pvTransitionDuration', i, '5') as string;
		if (dur) body.duration = dur;
		const res = this.getNodeParameter('pvTransitionResolution', i, '720p') as string;
		if (res) body.resolution = res;
		addOptionalNumber(this, body, 'pvTransitionSeed', i, 'seed');
		addOptionalField(this, body, 'pvt_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'pvt_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'pvt_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/create-transition`, body, `${basePath}/videos`);
	}

	if (operation === 'listLipSyncVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/voices`);
	}

	if (operation === 'listEffects') {
		const qs: Record<string, any> = {};
		const model = this.getNodeParameter('pvEffectsModel', i, '') as string;
		if (model) qs.model = model;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/effects`, {}, qs);
	}

	if (operation === 'getVideo') {
		const videoId = this.getNodeParameter('pvVideoId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${videoId}`);
	}

	if (operation === 'deleteVideo') {
		const videoId = this.getNodeParameter('pvVideoId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/videos/${videoId}`);
	}

	if (operation === 'getImage') {
		const imageId = this.getNodeParameter('pvImageId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/images/${imageId}`);
	}

	if (operation === 'deleteImage') {
		const imageId = this.getNodeParameter('pvImageId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/images/${imageId}`);
	}

	if (operation === 'addAccount') {
		const email = this.getNodeParameter('pvAccountEmail', i) as string;
		const body: Record<string, any> = {
			password: this.getNodeParameter('pvAccountPassword', i) as string,
		};
		const token = this.getNodeParameter('pvAccountToken', i, '') as string;
		if (token) body.token = token;
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts/${email}`, body);
	}

	if (operation === 'getAccount') {
		const email = this.getNodeParameter('pvAccountEmailGet', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${email}`);
	}

	if (operation === 'deleteAccount') {
		const email = this.getNodeParameter('pvAccountEmailGet', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${email}`);
	}

	if (operation === 'cancelJob') {
		const id = this.getNodeParameter('pvCancelJobId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/scheduler/${id}`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown PixVerse operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// MiniMax
// ──────────────────────────────────────────────────────────────

async function executeMinimax(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/minimax';

	if (operation === 'createVideo') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			resolution: this.getNodeParameter('resolution', i) as string,
			duration: this.getNodeParameter('duration', i) as number,
		};
		addOptionalField(this, body, 'image_url', i);
		addOptionalField(this, body, 'end_image_url', i);
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'mmVideoAsync', i, 'async');
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'captchaToken', i);
		addOptionalNumber(this, body, 'captchaRetry', i);
		addOptionalField(this, body, 'captchaOrder', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/create`, body, `${basePath}/videos`);
	}

	if (operation === 'createImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalNumber(this, body, 'mmImageSeed', i, 'seed');
		addOptionalField(this, body, 'mmImg_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'mmImg_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'mmImg_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'mmImg_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'mmImg_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/images`);
	}

	if (operation === 'createMusic') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'lyrics', i);
		addOptionalBool(this, body, 'instrumental', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'mmMusic_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'mmMusic_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'mmMusic_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'mmMusic_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'mmMusic_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/music/create`, body, `${basePath}/videos`);
	}

	if (operation === 'agent') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('message', i) as string,
		};
		addOptionalField(this, body, 'mmAgent_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'mmAgent_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'mmAgent_captchaOrder', i, 'captchaOrder');
		const asyncMode = this.getNodeParameter('asyncMode', i, false) as boolean;
		if (asyncMode) body.async = true;
		const response = await useApiRequest.call(this, 'POST', `${basePath}/agent`, body);
		const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;
		const jobId = response.jobId || response.jobid;
		if (wait && jobId) {
			return await waitForJob.call(this, `${basePath}/agent/${jobId}`);
		}
		return response;
	}

	if (operation === 'getVideoJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'getImageJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/images/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			url: this.getNodeParameter('mmAccountUrl', i) as string,
			token: this.getNodeParameter('mmAccountToken', i) as string,
		};
		const maxJobs = this.getNodeParameter('mmAccountMaxJobs', i, 3) as number;
		if (maxJobs) body.maxJobs = maxJobs;
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'deleteAccount') {
		const account = this.getNodeParameter('mmAccountId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${account}`);
	}

	if (operation === 'cancelVideo') {
		const videoId = this.getNodeParameter('mmCancelVideoId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/videos/${videoId}`);
	}

	if (operation === 'listAgentTemplates') {
		return await useApiRequest.call(this, 'GET', `${basePath}/agent/templates`);
	}

	if (operation === 'listCharacters') {
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/characters`);
	}

	if (operation === 'uploadFile') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
		const qs: IDataObject = {};
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.account = account;
		return await useApiBinaryUpload.call(this, `${basePath}/files/`, binaryPropertyName, i, qs);
	}

	throw new NodeOperationError(this.getNode(), `Unknown MiniMax operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// InsightFaceSwap
// ──────────────────────────────────────────────────────────────

async function executeInsightfaceswap(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/faceswap';

	if (operation === 'swapFace') {
		const body: Record<string, any> = {
			target: this.getNodeParameter('target', i) as string,
			source: this.getNodeParameter('source', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'iface_replyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'iface_replyRef', i, 'replyRef');
		addOptionalField(this, body, 'iface_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'iface_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'iface_captchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/jobs/swapface`, body, `${basePath}/jobs`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/jobs/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Unknown InsightFaceSwap operation: ${operation}`,
		{ itemIndex: i },
	);
}

// ──────────────────────────────────────────────────────────────
// Google Flow
// ──────────────────────────────────────────────────────────────

async function executeGoogleFlow(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/google-flow';

	if (operation === 'generateImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'model', i);
		addOptionalField(this, body, 'aspect_ratio', i);
		addOptionalNumber(this, body, 'image_count', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'gfImgReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'replyRef', i);
		addOptionalField(this, body, 'gfImgEmail', i, 'email');
		addOptionalField(this, body, 'gfImgCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfImgCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfImgCaptchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images`, body, `${basePath}/jobs`);
	}

	if (operation === 'upscaleImage') {
		const body: Record<string, any> = {
			assetId: this.getNodeParameter('assetId', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'gfUpvImgEmail', i, 'email');
		addOptionalField(this, body, 'gfUpvImgReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'gfUpvImgReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'gfUpvImgCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfUpvImgCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfUpvImgCaptchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/images/upscale`, body, `${basePath}/jobs`);
	}

	if (operation === 'generateVideo') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
		};
		addOptionalField(this, body, 'aspect_ratio', i);
		addOptionalNumber(this, body, 'gfVideoDuration', i, 'duration');
		// referenceUrls collection is intentionally omitted — individual referenceImage_1/2/3 fields are used below
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'gfEmail', i, 'email');
		addOptionalNumber(this, body, 'gfCount', i, 'count');
		addOptionalNumber(this, body, 'gfSeed', i, 'seed');
		addOptionalBool(this, body, 'gfAsync', i, 'async');
		addOptionalField(this, body, 'gfReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'gfReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'gfStartImage', i, 'startImage');
		addOptionalField(this, body, 'gfEndImage', i, 'endImage');
		addOptionalField(this, body, 'gfRefImage1', i, 'referenceImage_1');
		addOptionalField(this, body, 'gfRefImage2', i, 'referenceImage_2');
		addOptionalField(this, body, 'gfRefImage3', i, 'referenceImage_3');
		addOptionalField(this, body, 'gfCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfCaptchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos`, body, `${basePath}/jobs`);
	}

	if (operation === 'concatenateVideos') {
		const videoUrlsData = this.getNodeParameter('videoUrls', i, {}) as { items?: Array<{ url: string }> };
		const videoUrls = videoUrlsData.items?.map((item) => item.url).filter(Boolean) || [];
		const media = videoUrls.map((url) => ({ mediaGenerationId: url }));
		const body: Record<string, any> = { media };
		addOptionalField(this, body, 'gfConcatEmail', i, 'email');
		addOptionalField(this, body, 'gfConcatReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'gfConcatReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'gfConcatCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfConcatCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfConcatCaptchaOrder', i, 'captchaOrder');
		return await useApiRequest.call(this, 'POST', `${basePath}/videos/concatenate`, body);
	}

	if (operation === 'extendVideo') {
		const body: Record<string, any> = {
			mediaGenerationId: this.getNodeParameter('videoUrl', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'gfExtEmail', i, 'email');
		addOptionalField(this, body, 'gfExtReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'gfExtReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'gfExtCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfExtCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfExtCaptchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/extend`, body, `${basePath}/jobs`);
	}

	if (operation === 'createGif') {
		const body: Record<string, any> = {
			mediaGenerationId: this.getNodeParameter('videoUrl', i) as string,
		};
		addOptionalNumber(this, body, 'fps', i);
		addOptionalField(this, body, 'gfGifEmail', i, 'email');
		addOptionalField(this, body, 'gfGifReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'gfGifReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'gfGifCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfGifCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfGifCaptchaOrder', i, 'captchaOrder');
		return await useApiRequest.call(this, 'POST', `${basePath}/videos/gif`, body);
	}

	if (operation === 'upscaleVideo') {
		const body: Record<string, any> = {
			mediaGenerationId: this.getNodeParameter('videoUrl', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'gfUpvEmail', i, 'email');
		addOptionalField(this, body, 'gfUpvCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'gfUpvCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'gfUpvCaptchaOrder', i, 'captchaOrder');
		return await postAndMaybePoll(this, i, `${basePath}/videos/upscale`, body, `${basePath}/jobs`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/jobs/${jobid}`);
	}

	if (operation === 'listJobs') {
		const qs: Record<string, any> = {};
		const account = this.getNodeParameter('account', i, '') as string;
		const status = this.getNodeParameter('status', i, '') as string;
		if (account) qs.account = account;
		if (status) qs.status = status;
		return await useApiRequest.call(this, 'GET', `${basePath}/jobs`, {}, qs);
	}

	if (operation === 'cancelJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/jobs/${jobid}`);
	}

	if (operation === 'listAssets') {
		const qs: Record<string, any> = {};
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.account = account;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets`, {}, qs);
	}

	if (operation === 'listAssetsByAccount') {
		const account = this.getNodeParameter('account', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/assets/${account}`);
	}

	if (operation === 'deleteAsset') {
		const assetId = this.getNodeParameter('assetId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/assets/${assetId}`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			cookies: this.getNodeParameter('cookies', i) as string,
		};
		addOptionalNumber(this, body, 'maxJobs', i);
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'getAccount') {
		const account = this.getNodeParameter('account', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${account}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'deleteAccount') {
		const account = this.getNodeParameter('account', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${account}`);
	}

	if (operation === 'configureCaptcha') {
		const body: Record<string, any> = {
			account: this.getNodeParameter('account', i) as string,
			provider: this.getNodeParameter('provider', i) as string,
			apiKey: this.getNodeParameter('apiKey', i) as string,
		};
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts/captcha-providers`, body);
	}

	if (operation === 'listCaptchaProviders') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/captcha-providers`);
	}

	if (operation === 'getCaptchaStats') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/captcha-stats`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Google Flow operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// Mureka
// ──────────────────────────────────────────────────────────────

async function executeMureka(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/mureka';

	const murekaPostAndPoll = async (
		postEndpoint: string,
		body: Record<string, any>,
	): Promise<any> => {
		const response = await useApiRequest.call(this, 'POST', postEndpoint, body);
		const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;
		const songId = response.song_id || response.jobId || response.jobid;
		if (wait && songId) {
			return await waitForJob.call(this, `${basePath}/jobs/${songId}`);
		}
		return response;
	};

	if (operation === 'createSong') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'model', i);
		addOptionalField(this, body, 'style', i);
		addOptionalField(this, body, 'customLyrics', i);
		addOptionalBool(this, body, 'instrumental', i);
		addOptionalField(this, body, 'account', i);
		addOptionalBool(this, body, 'mure_createSongAsync', i, 'async');
		addOptionalField(this, body, 'murekacreateSongReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekacreateSongReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekacreateSongCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekacreateSongCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekacreateSongCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/music/create`, body);
	}

	if (operation === 'createAdvancedSong') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			lyrics: this.getNodeParameter('lyrics', i) as string,
		};
		addOptionalField(this, body, 'model', i);
		addOptionalField(this, body, 'style', i);
		addOptionalField(this, body, 'vocalRef', i, 'vocal_id');
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'murekacreateAdvancedSongReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekacreateAdvancedSongReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekacreateAdvancedSongCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekacreateAdvancedSongCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekacreateAdvancedSongCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/music/create-advanced`, body);
	}

	if (operation === 'createInstrumental') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'model', i);
		addOptionalField(this, body, 'style', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'murekacreateInstrumentalReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekacreateInstrumentalReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekacreateInstrumentalCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekacreateInstrumentalCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekacreateInstrumentalCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/music/create-instrumental`, body);
	}

	if (operation === 'generateLyrics') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'style', i);
		addOptionalField(this, body, 'account', i);
		return await useApiRequest.call(this, 'POST', `${basePath}/music/lyrics-generate`, body);
	}

	if (operation === 'textToSpeech') {
		const body: Record<string, any> = {
			text: this.getNodeParameter('text', i) as string,
		};
		addOptionalField(this, body, 'voiceId', i, 'voice_id');
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'murekatextToSpeechReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekatextToSpeechReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekatextToSpeechCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekatextToSpeechCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekatextToSpeechCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/speech`, body);
	}

	if (operation === 'listVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/speech/voices`);
	}

	if (operation === 'listMoodsGenres') {
		return await useApiRequest.call(this, 'GET', `${basePath}/music/moods-and-genres`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			token: this.getNodeParameter('murekaAccountToken', i) as string,
		};
		const maxJobs = this.getNodeParameter('murekaAccountMaxJobs', i, 0) as number;
		if (maxJobs) body.maxJobs = maxJobs;
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'getAccount') {
		const account = this.getNodeParameter('murekaAccountId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${account}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'deleteAccount') {
		const account = this.getNodeParameter('murekaAccountId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${account}`);
	}

	if (operation === 'getSong') {
		const songId = this.getNodeParameter('murekaSongId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/music/${songId}`);
	}

	if (operation === 'listSongs') {
		const qs: Record<string, any> = {};
		const account = this.getNodeParameter('murekaSongsAccount', i, '') as string;
		if (account) qs.account = account;
		return await useApiRequest.call(this, 'GET', `${basePath}/music`, {}, qs);
	}

	if (operation === 'deleteSong') {
		const songId = this.getNodeParameter('murekaSongId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/music/${songId}`);
	}

	if (operation === 'downloadSong') {
		const body: Record<string, any> = {
			song_id: this.getNodeParameter('murekaDownloadSongId', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		const response = await useApiRequest.call(this, 'POST', `${basePath}/music/download`, body);
		const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;
		const jobId = response.job_id || response.jobId || response.jobid;
		if (wait && jobId) {
			return await waitForJob.call(this, `${basePath}/jobs/${jobId}`);
		}
		return response;
	}

	if (operation === 'extendSong') {
		const body: Record<string, any> = {
			song_id: this.getNodeParameter('murekaExtendSongId', i) as string,
		};
		const prompt = this.getNodeParameter('murekaExtendPrompt', i, '') as string;
		if (prompt) body.prompt = prompt;
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'murekaExtendSongReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekaExtendSongReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekaExtendSongCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekaExtendSongCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekaExtendSongCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/music/extend`, body);
	}

	if (operation === 'generateMusicVideo') {
		const body: Record<string, any> = {
			song_id: this.getNodeParameter('murekaVideoSongId', i) as string,
		};
		const style = this.getNodeParameter('murekaVideoStyle', i, '') as string;
		if (style) body.style = style;
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'murekaVideoReplyUrl', i, 'replyUrl');
		addOptionalField(this, body, 'murekaVideoReplyRef', i, 'replyRef');
		addOptionalField(this, body, 'murekaVideoCaptchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'murekaVideoCaptchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'murekaVideoCaptchaOrder', i, 'captchaOrder');
		return await murekaPostAndPoll(`${basePath}/music/video-generate`, body);
	}

	throw new NodeOperationError(this.getNode(), `Unknown Mureka operation: ${operation}`, {
		itemIndex: i,
	});
}

// ──────────────────────────────────────────────────────────────
// TemPolor
// ──────────────────────────────────────────────────────────────

async function executeTempolor(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const basePath = '/tempolor';

	const temporlorPostAndPoll = async (
		postEndpoint: string,
		body: Record<string, any>,
	): Promise<any> => {
		const asyncMode = this.getNodeParameter('asyncMode', i, false) as boolean;
		if (asyncMode) body.async = true;
		const response = await useApiRequest.call(this, 'POST', postEndpoint, body);
		const wait = this.getNodeParameter('waitForCompletion', i, true) as boolean;
		const jobId = response.job_id || response.jobId || response.jobid;
		if (wait && jobId) {
			return await waitForJob.call(this, `${basePath}/music/${jobId}`);
		}
		return response;
	};

	if (operation === 'createSong') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'lyrics', i);
		addOptionalField(this, body, 'style', i);
		addOptionalNumber(this, body, 'duration', i);
		addOptionalNumber(this, body, 'bpm', i);
		addOptionalField(this, body, 'account', i);
		addOptionalBool(this, body, 'tpSongAsync', i, 'async');
		addOptionalField(this, body, 'tp_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'tp_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'tp_captchaOrder', i, 'captchaOrder');
		return await temporlorPostAndPoll(`${basePath}/music/song`, body);
	}

	if (operation === 'createInstrumental') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'style', i);
		addOptionalNumber(this, body, 'duration', i);
		addOptionalNumber(this, body, 'bpm', i);
		addOptionalField(this, body, 'account', i);
		addOptionalBool(this, body, 'tpInstrumentalAsync', i, 'async');
		addOptionalField(this, body, 'tp_captchaToken', i, 'captchaToken');
		addOptionalNumber(this, body, 'tp_captchaRetry', i, 'captchaRetry');
		addOptionalField(this, body, 'tp_captchaOrder', i, 'captchaOrder');
		return await temporlorPostAndPoll(`${basePath}/music/instrumental`, body);
	}

	if (operation === 'splitStems') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
		const qs: IDataObject = {};
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.user_id = account;
		return await useApiBinaryUpload.call(this, `${basePath}/music/stems-splitter/`, binaryPropertyName, i, qs);
	}

	if (operation === 'getSong') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/music/${jobId}`);
	}

	if (operation === 'downloadSong') {
		const jobId = this.getNodeParameter('jobId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/music/download/${jobId}`);
	}

	if (operation === 'listArtistVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/music/artist-voices`);
	}

	if (operation === 'addAccount') {
		const body: Record<string, any> = {
			token: this.getNodeParameter('tpAccountToken', i) as string,
		};
		const maxJobs = this.getNodeParameter('tpAccountMaxJobs', i, 0) as number;
		if (maxJobs) body.maxJobs = maxJobs;
		return await useApiRequest.call(this, 'POST', `${basePath}/accounts`, body);
	}

	if (operation === 'getAccount') {
		const userId = this.getNodeParameter('tpAccountUserId', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts/${userId}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
	}

	if (operation === 'deleteAccount') {
		const userId = this.getNodeParameter('tpAccountUserId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/accounts/${userId}`);
	}

	if (operation === 'deleteSong') {
		const jobId = this.getNodeParameter('tpDeleteSongJobId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/music/${jobId}`);
	}

	if (operation === 'uploadMidi') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
		const midiName = this.getNodeParameter('tpMidiName', i) as string;
		const qs: IDataObject = { name: midiName };
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.user_id = account;
		return await useApiBinaryUpload.call(this, `${basePath}/music/midi/`, binaryPropertyName, i, qs);
	}

	if (operation === 'listMidi') {
		return await useApiRequest.call(this, 'GET', `${basePath}/music/midi`);
	}

	if (operation === 'deleteMidi') {
		const midiId = this.getNodeParameter('tpMidiId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/music/midi/${midiId}`);
	}

	if (operation === 'cloneVoice') {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
		const voiceName = this.getNodeParameter('tpCloneVoiceName', i) as string;
		const qs: IDataObject = { name: voiceName };
		const account = this.getNodeParameter('account', i, '') as string;
		if (account) qs.user_id = account;
		return await useApiBinaryUpload.call(this, `${basePath}/music/cloned-voices/`, binaryPropertyName, i, qs);
	}

	if (operation === 'listClonedVoices') {
		return await useApiRequest.call(this, 'GET', `${basePath}/music/cloned-voices`);
	}

	if (operation === 'deleteClonedVoice') {
		const voiceId = this.getNodeParameter('tpClonedVoiceId', i) as string;
		return await useApiRequest.call(this, 'DELETE', `${basePath}/music/cloned-voices/${voiceId}`);
	}

	throw new NodeOperationError(this.getNode(), `Unknown TemPolor operation: ${operation}`, {
		itemIndex: i,
	});
}
