import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { useApiRequest, waitForJob } from './GenericFunctions';
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
			'Interact with AI services via useapi.net (Midjourney, Dreamina, Kling, Runway, PixVerse, MiniMax, InsightFaceSwap)',
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
			// Fields
			...midjourneyFields,
			...dreaminaFields,
			...klingFields,
			...runwayFields,
			...pixverseFields,
			...minimaxFields,
			...insightfaceswapFields,
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

async function postAndMaybePoll(
	ctx: IExecuteFunctions,
	i: number,
	postEndpoint: string,
	body: Record<string, any>,
	pollEndpointPrefix: string,
	idField: string = 'jobid',
): Promise<any> {
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
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		addOptionalField(this, body, 'replyRef', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/imagine`, body, `${basePath}/jobs`);
	}

	if (operation === 'button') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
			button: this.getNodeParameter('button', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		return await postAndMaybePoll(this, i, `${basePath}/jobs/button`, body, `${basePath}/jobs`);
	}

	if (operation === 'describe') {
		const body: Record<string, any> = {};
		addOptionalField(this, body, 'url', i);
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
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
		addOptionalField(this, body, 'replyUrl', i);
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
		addOptionalField(this, body, 'account', i);
		addOptionalField(this, body, 'replyUrl', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos`, body, `${basePath}/videos`);
	}

	if (operation === 'upscaleImage') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
			imageIndex: this.getNodeParameter('imageIndex', i) as number,
			resolution: this.getNodeParameter('resolution', i) as string,
		};
		addOptionalField(this, body, 'account', i);
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
		addOptionalNumber(this, body, 'cfg_scale', i);
		addOptionalField(this, body, 'account', i);
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
		addOptionalNumber(this, body, 'cfg_scale', i);
		addOptionalField(this, body, 'account', i);
		return await klingPostAndPoll(`${basePath}/videos/omni`, body);
	}

	if (operation === 'imageToVideoEffects') {
		const body: Record<string, any> = {
			image_url: this.getNodeParameter('image_url', i) as string,
			effect_id: this.getNodeParameter('effect_id', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await klingPostAndPoll(`${basePath}/videos/image2video-effects`, body);
	}

	if (operation === 'extendVideo') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'account', i);
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
		return await klingPostAndPoll(`${basePath}/videos/lipsync`, body);
	}

	if (operation === 'addSound') {
		const body: Record<string, any> = {
			task_id: this.getNodeParameter('task_id', i) as string,
		};
		addOptionalField(this, body, 'account', i);
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
		return await klingPostAndPoll(`${basePath}/videos/motion-create`, body);
	}

	if (operation === 'textToImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			aspect_ratio: this.getNodeParameter('aspect_ratio', i) as string,
		};
		addOptionalField(this, body, 'negative_prompt', i);
		addOptionalField(this, body, 'account', i);
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
		return await klingPostAndPoll(`${basePath}/images/omni`, body);
	}

	if (operation === 'virtualTryOn') {
		const body: Record<string, any> = {
			human_image_url: this.getNodeParameter('human_image_url', i) as string,
			cloth_image_url: this.getNodeParameter('cloth_image_url', i) as string,
		};
		addOptionalField(this, body, 'account', i);
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
			url: this.getNodeParameter('url', i) as string,
		};
		return await useApiRequest.call(this, 'POST', `${basePath}/assets`, body);
	}

	if (operation === 'listAssets') {
		return await useApiRequest.call(this, 'GET', `${basePath}/assets`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
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
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			ratio: this.getNodeParameter('ratio', i) as string,
			duration: this.getNodeParameter('duration', i) as number,
		};
		addOptionalField(this, body, 'image_url', i);
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'exploreMode', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/create`, body, `${basePath}/videos`);
	}

	if (operation === 'createImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
			ratio: this.getNodeParameter('ratio', i) as string,
		};
		addOptionalNumber(this, body, 'seed', i);
		addOptionalBool(this, body, 'exploreMode', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/images`);
	}

	if (operation === 'lipSync') {
		const body: Record<string, any> = {
			video_url: this.getNodeParameter('video_url', i) as string,
		};
		addOptionalField(this, body, 'audio_url', i);
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/lipsync/create`, body, `${basePath}/videos`);
	}

	if (operation === 'actTwo') {
		const body: Record<string, any> = {
			video_url: this.getNodeParameter('video_url', i) as string,
			reference_url: this.getNodeParameter('reference_url', i) as string,
		};
		addOptionalField(this, body, 'account', i);
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
		return await postAndMaybePoll(this, i, `${basePath}/frames/create`, body, `${basePath}/videos`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
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
		addOptionalField(this, body, 'account', i);
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
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/videos`);
	}

	if (operation === 'extendVideo') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
		};
		addOptionalField(this, body, 'prompt', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/extend-v4`, body, `${basePath}/videos`);
	}

	if (operation === 'upscaleVideo') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/upscale`, body, `${basePath}/videos`);
	}

	if (operation === 'lipSync') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
		};
		addOptionalField(this, body, 'audio_url', i);
		addOptionalField(this, body, 'text', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/lipsync`, body, `${basePath}/videos`);
	}

	if (operation === 'modifyVideo') {
		const body: Record<string, any> = {
			jobid: this.getNodeParameter('jobid', i) as string,
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/modify`, body, `${basePath}/videos`);
	}

	if (operation === 'getJob') {
		const jobid = this.getNodeParameter('jobid', i) as string;
		return await useApiRequest.call(this, 'GET', `${basePath}/videos/${jobid}`);
	}

	if (operation === 'listAccounts') {
		return await useApiRequest.call(this, 'GET', `${basePath}/accounts`);
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
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/videos/create`, body, `${basePath}/videos`);
	}

	if (operation === 'createImage') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
			model: this.getNodeParameter('model', i) as string,
		};
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/images/create`, body, `${basePath}/images`);
	}

	if (operation === 'createMusic') {
		const body: Record<string, any> = {
			prompt: this.getNodeParameter('prompt', i) as string,
		};
		addOptionalField(this, body, 'lyrics', i);
		addOptionalBool(this, body, 'instrumental', i);
		addOptionalField(this, body, 'account', i);
		return await postAndMaybePoll(this, i, `${basePath}/music/create`, body, `${basePath}/videos`);
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
