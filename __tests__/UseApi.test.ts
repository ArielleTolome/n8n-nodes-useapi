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
		// At minimum, Midjourney and Dreamina should be present
		expect(resourceValues).toContain('midjourney');
		expect(resourceValues).toContain('dreamina');
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
