import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, defaultClientConditions, defaultServerConditions } from 'vite';

export default defineConfig({
	plugins: [sveltekit(),
		{
			// 插件名称
			name: 'tslib-fix',
			// 在所有插件之后执行（确保其他插件先运行）
			enforce: 'post',
			// 插件配置
			config() {
				return {
					// 客户端解析配置
					resolve: {
						conditions: [...defaultClientConditions],
					},
					// SSR 解析配置
					ssr: {
						resolve: {
							conditions: [...defaultServerConditions],
							// 外部条件（确保 SSR 环境下正确加载 tslib）
							externalConditions: [...defaultServerConditions],
						},
					},
				};
			},
		},
	],
	resolve: {
		conditions: ['browser'],
	},
	test: {
		projects: [
			{
				extends: './vite.config.js',
				plugins: [svelteTesting({
					resolveBrowser: true
				})],
				test: {
					name: 'unit',
					environment: 'jsdom',
					globals: true,
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.js'],
					coverage: {
						provider: 'v8',
						reporter: ['text', 'html', 'lcov'],
						reportOnFailure: true,
						include: ['src/**/*.{js,ts,svelte}'],
						exclude: ['src/**/*.{test,spec}.{js,ts}', 'src/lib/server/**']
					}
				}
			},
			{
				extends: './vite.config.js',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		],
		reporters: ["html"],
		outputFile: "./test-results/index.html",
	},
	server:{
		open: true,
		port: 6443,
		host:'0.0.0.0',
		proxy:{
			'/api': "http://localhost:6612",
			"/api/ws":{
				target: "http://localhost:6612",
				ws: true
			}
		},
	},
});
