module.exports = {
	root: true,
	env: {
		node: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: ['n8n-nodes-base'],
	extends: ['plugin:n8n-nodes-base/community'],
	rules: {},
}
