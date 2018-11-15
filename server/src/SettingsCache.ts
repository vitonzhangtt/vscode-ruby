import { TextDocument, WorkspaceFolder } from 'vscode-languageserver';

export type RubyEnvironment = {
	PATH: string;
	RUBY_VERSION: string;
	RUBY_ROOT: string;
	GEM_HOME: string;
	GEM_PATH: string;
	GEM_ROOT: string;
	RUBOCOP_OPTS?: string;
};

export interface RubyConfiguration {}

class SettingsCache<P extends WorkspaceFolder | TextDocument, T> {
	private cache: Map<string, T>;
	public fetcher: (target: string[]) => Promise<T[]>;

	constructor() {
		this.cache = new Map();
	}

	public set(target: P | string, env: T): void {
		const key = typeof target === 'string' ? target : target.uri;
		this.cache.set(key, env);
	}

	public setAll(targets: { [key: string]: T }): void {
		for (const target of Object.keys(targets)) {
			this.set(target, targets[target]);
		}
	}

	public delete(target: P): boolean {
		return this.cache.delete(target.uri);
	}

	public deleteAll(targets: P[]): void {
		for (const target of targets) {
			this.delete(target);
		}
	}

	public async get(target: P | string): Promise<T | undefined> {
		const key = typeof target === 'string' ? target : target.uri;
		let settings: T = this.cache.get(key);
		if (!settings) {
			const result = await this.fetcher([key]);
			settings = result.length > 0 ? result[0] : undefined;

			if (settings) {
				this.set(key, settings);
			}
		}

		return settings;
	}

	public async getAll(targets: P[]): Promise<{ [key: string]: T }> {
		const settings: { [key: string]: T } = {};

		for (const target of targets) {
			settings[target.uri] = await this.get(target);
		}

		return settings;
	}

	public flush(): void {
		this.cache.clear();
	}

	public toString(): string {
		return this.cache.toString();
	}
}

export const documentConfigurationCache = new SettingsCache<TextDocument, RubyConfiguration>();
export const workspaceRubyEnvironmentCache = new SettingsCache<WorkspaceFolder, RubyEnvironment>();