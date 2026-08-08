/**
 * Smoke tests for the UseApi node.
 * Verifies the node can be instantiated and has the required n8n description shape.
 * No API calls or n8n runtime required.
 */

import type { INodeProperties } from 'n8n-workflow';
import { UseApi } from '../nodes/UseApi/UseApi.node';

describe('UseApi node', () => {
	let node: UseApi;

	beforeEach(() => {
		node = new UseApi();
	});

	it('can be instantiated', () => {
		expect(node).toBeDefined();
	});

	it('has a description property', () => {
		expect(node.description).toBeDefined();
	});

	it('has the correct node name', () => {
		expect(node.description.name).toBe('useApi');
	});

	it('has a non-empty displayName', () => {
		expect(typeof node.description.displayName).toBe('string');
		expect(node.description.displayName.length).toBeGreaterThan(0);
	});

	it('has an array of properties', () => {
		expect(Array.isArray(node.description.properties)).toBe(true);
		expect(node.description.properties.length).toBeGreaterThan(0);
	});

	it('requires useApiCredentials credential', () => {
		const creds = node.description.credentials as Array<{ name: string; required?: boolean }>;
		expect(Array.isArray(creds)).toBe(true);
		const useApiCred = creds.find((c) => c.name === 'useApiCredentials');
		expect(useApiCred).toBeDefined();
		expect(useApiCred?.required).toBe(true);
	});

	it('has a resource property with options', () => {
		const resourceProp = node.description.properties.find(
			(p: INodeProperties) => p.name === 'resource',
		);
		expect(resourceProp).toBeDefined();
		expect(Array.isArray(resourceProp?.options)).toBe(true);
		expect((resourceProp?.options as unknown[]).length).toBeGreaterThan(0);
	});

	it('includes expected resource types', () => {
		const resourceProp = node.description.properties.find(
			(p: INodeProperties) => p.name === 'resource',
		);
		const options = resourceProp?.options as Array<{ value: string }>;
		const resourceValues = options.map((o) => o.value);
		expect(resourceValues).toContain('googleFlow');
		expect(resourceValues).toContain('minimax');
		expect(resourceValues).toContain('dreamina');
		expect(resourceValues).toContain('flowMusic');
		expect(resourceValues).toContain('midjourney'); // discontinued but retained
	});

	it('has inputs and outputs defined', () => {
		expect(node.description.inputs).toBeDefined();
		expect(node.description.outputs).toBeDefined();
	});

	it('has a version number', () => {
		expect(node.description.version).toBeDefined();
		expect(typeof node.description.version === 'number' || Array.isArray(node.description.version)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Resource + operation coverage
// ---------------------------------------------------------------------------

describe('UseApi node — resource and operation coverage', () => {
	let node: UseApi;
	let allProperties: INodeProperties[];

	beforeEach(() => {
		node = new UseApi();
		allProperties = node.description.properties as INodeProperties[];
	});

	/** Helper: collect operation values for a given resource slug */
	function operationsFor(resource: string): string[] {
		return allProperties
			.filter(
				(p) =>
					p.name === 'operation' &&
					(p.displayOptions?.show as Record<string, string[]> | undefined)?.resource?.includes(
						resource,
					),
			)
			.flatMap((p) => (p.options as Array<{ value: string }>)?.map((o) => o.value) ?? []);
	}

	const expectedResources = ['googleFlow', 'flowMusic', 'midjourney', 'dreamina', 'kling', 'runway', 'minimax', 'tempolor', 'pixverse'];

	it.each(expectedResources)(
		'resource "%s" exists in the resource dropdown',
		(resource) => {
			const resourceProp = allProperties.find((p) => p.name === 'resource');
			const options = resourceProp?.options as Array<{ value: string }>;
			const values = options.map((o) => o.value);
			expect(values).toContain(resource);
		},
	);

	it.each(expectedResources)(
		'resource "%s" has at least one operation',
		(resource) => {
			const ops = operationsFor(resource);
			expect(ops.length).toBeGreaterThan(0);
		},
	);

	it('midjourney resource has imagine operation', () => {
		const ops = operationsFor('midjourney');
		expect(ops).toContain('imagine');
	});

	it('midjourney resource has button operation', () => {
		const ops = operationsFor('midjourney');
		expect(ops).toContain('button');
	});

	it('dreamina resource has generateImage operation', () => {
		const ops = operationsFor('dreamina');
		expect(ops).toContain('generateImage');
	});

	it('kling resource has textToVideo operation', () => {
		const ops = operationsFor('kling');
		expect(ops).toContain('textToVideo');
	});
});

// ---------------------------------------------------------------------------
// waitForCompletion field
// ---------------------------------------------------------------------------

describe('UseApi node — waitForCompletion fields', () => {
	let node: UseApi;
	let allProperties: INodeProperties[];

	beforeEach(() => {
		node = new UseApi();
		allProperties = node.description.properties as INodeProperties[];
	});

	it('has at least one waitForCompletion boolean field', () => {
		const fields = allProperties.filter((p) => p.name === 'waitForCompletion');
		expect(fields.length).toBeGreaterThan(0);
		// Every waitForCompletion field should be a boolean
		for (const f of fields) {
			expect(f.type).toBe('boolean');
		}
	});

	it('waitForCompletion exists on midjourney imagine operation', () => {
		const fields = allProperties.filter(
			(p) =>
				p.name === 'waitForCompletion' &&
				(p.displayOptions?.show as Record<string, string[]> | undefined)?.resource?.includes(
					'midjourney',
				) &&
				(p.displayOptions?.show as Record<string, string[]> | undefined)?.operation?.includes(
					'imagine',
				),
		);
		expect(fields.length).toBeGreaterThan(0);
	});

	it('waitForCompletion exists on midjourney button operation', () => {
		const fields = allProperties.filter(
			(p) =>
				p.name === 'waitForCompletion' &&
				(p.displayOptions?.show as Record<string, string[]> | undefined)?.resource?.includes(
					'midjourney',
				) &&
				(p.displayOptions?.show as Record<string, string[]> | undefined)?.operation?.includes(
					'button',
				),
		);
		expect(fields.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

describe('UseApi node — credentials', () => {
	it('credentials array is non-empty', () => {
		const node = new UseApi();
		const creds = node.description.credentials as Array<{ name: string; required?: boolean }>;
		expect(Array.isArray(creds)).toBe(true);
		expect(creds.length).toBeGreaterThan(0);
	});

	it('uses credential type "useApiCredentials"', () => {
		const node = new UseApi();
		const creds = node.description.credentials as Array<{ name: string; required?: boolean }>;
		const names = creds.map((c) => c.name);
		expect(names).toContain('useApiCredentials');
	});

	it('useApiCredentials credential is marked required', () => {
		const node = new UseApi();
		const creds = node.description.credentials as Array<{ name: string; required?: boolean }>;
		const cred = creds.find((c) => c.name === 'useApiCredentials');
		expect(cred?.required).toBe(true);
	});
});


// ---------------------------------------------------------------------------
// Latest UseAPI model catalog (Aug 2026)
// ---------------------------------------------------------------------------

describe('UseApi node — Aug 2026 model catalogs', () => {
	let allProperties: import('n8n-workflow').INodeProperties[];

	beforeEach(() => {
		allProperties = new (require('../nodes/UseApi/UseApi.node').UseApi)().description
			.properties as import('n8n-workflow').INodeProperties[];
	});

	function modelValues(resource: string, operation: string): string[] {
		return allProperties
			.filter(
				(p) =>
					(p.name === 'model' || p.name === 'pvFusionModel' || p.name === 'pvMusicModel' || p.name === 'pvSpeechModel') &&
					(p.displayOptions?.show as Record<string, string[]> | undefined)?.resource?.includes(resource) &&
					(p.displayOptions?.show as Record<string, string[]> | undefined)?.operation?.includes(operation),
			)
			.flatMap((p) => (p.options as Array<{ value: string }>)?.map((o) => o.value) ?? []);
	}

	function operationsFor(resource: string): string[] {
		return allProperties
			.filter(
				(p) =>
					p.name === 'operation' &&
					(p.displayOptions?.show as Record<string, string[]> | undefined)?.resource?.includes(resource),
			)
			.flatMap((p) => (p.options as Array<{ value: string }>)?.map((o) => o.value) ?? []);
	}

	it('minimax createVideo includes Hailuo-3.0 and Seedance-2.0 family', () => {
		const vals = modelValues('minimax', 'createVideo');
		expect(vals).toEqual(expect.arrayContaining(['Hailuo-3.0', 'Seedance-2.0', 'Seedance-2.0-Fast', 'Seedance-2.0-Mini']));
	});

	it('googleFlow images default catalog includes nano-banana-2-lite', () => {
		const vals = modelValues('googleFlow', 'generateImage');
		expect(vals).toEqual(expect.arrayContaining(['nano-banana-2-lite', 'nano-banana-2', 'nano-banana-pro']));
	});

	it('googleFlow videos include lite + omni-flash', () => {
		const vals = modelValues('googleFlow', 'generateVideo');
		expect(vals).toEqual(expect.arrayContaining(['veo-3.1-fast', 'veo-3.1-lite', 'omni-flash']));
	});

	it('dreamina videos include seedance-2.5', () => {
		const vals = modelValues('dreamina', 'generateVideo');
		expect(vals).toContain('seedance-2.5');
	});

	it('flowMusic resource exposes createMusic', () => {
		expect(operationsFor('flowMusic')).toContain('createMusic');
	});

	it('pixverse exposes createSpeech and createMusic', () => {
		const ops = operationsFor('pixverse');
		expect(ops).toEqual(expect.arrayContaining(['createSpeech', 'createMusic']));
	});

	it('runway includes seedance-2 family and videoUpscale', () => {
		const vals = modelValues('runway', 'createVideo');
		expect(vals).toEqual(expect.arrayContaining(['seedance-2', 'seedance-2-fast', 'grok-imagine-1.5', 'happyhorse-1.0']));
		expect(operationsFor('runway')).toContain('videoUpscale');
	});

	it('kling supports passToken field and turbo model', () => {
		expect(modelValues('kling', 'textToVideo')).toContain('kling-v3-0-turbo');
		expect(allProperties.some((p) => p.name === 'klingPassToken')).toBe(true);
	});

	it('googleFlow exposes getAsset and characters/voices helpers', () => {
		expect(operationsFor('googleFlow')).toEqual(expect.arrayContaining(['getAsset', 'createCharacter', 'listVoices']));
	});

	it('pixverse exposes motionControl and music get/list', () => {
		expect(operationsFor('pixverse')).toEqual(expect.arrayContaining(['motionControl', 'getMusic', 'listMusicTracks']));
	});
});
