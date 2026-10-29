import { eslintConfig } from '@planning-inspectorate/coding-standards';
import { defineConfig } from 'eslint/config';

export default defineConfig(eslintConfig, {
	files: ['**/*.ts'],
	rules: {
		// TODO: replace explicit `any` usages and remove this override
		'@typescript-eslint/no-explicit-any': 'off'
	}
});
