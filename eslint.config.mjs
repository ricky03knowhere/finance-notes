import tseslint from 'typescript-eslint';

export default tseslint.config({
	ignores: ['.next/**', 'node_modules/**', 'prisma/**'],
	extends: [tseslint.configs.recommended],
});