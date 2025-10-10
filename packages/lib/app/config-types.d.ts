export interface DatabaseConfig {
	connectionString?: string;
}

interface BaseConfig {
	appHostname: string;
	cacheControl: {
		maxAge: string;
	};
	database: DatabaseConfig;
	gitSha?: string;
	httpPort: number;
	logLevel: string;
	NODE_ENV: string;
	srcDir: string;
	session: {
		redisPrefix: string;
		redis?: string;
		secret: string;
	};
	staticDir: string;
}
