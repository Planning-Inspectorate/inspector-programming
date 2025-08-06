import { createApp } from './app/app.js';
import { loadConfig } from './app/config.js';
import { WebService } from '#service';
import { memoryUsage } from 'node:process';

const config = loadConfig();
const service = new WebService(config);

const app = createApp(service);

// Trust proxy, because our application is behind Front Door
// required for secure session cookies
// see https://expressjs.com/en/resources/middleware/session.html#cookiesecure
app.set('trust proxy', true);

// set the HTTP port to use from loaded config
app.set('http-port', config.httpPort);

// start the app, listening for incoming requests on the given port
app.listen(app.get('http-port'), () => {
	service.logger.info(`Server is running at http://localhost:${app.get('http-port')} in ${app.get('env')} mode`);
});

let currentUsage = 0;
setInterval(() => {
  const usage = memoryUsage.rss();
  const usageMB = Math.round(usage / 1024 / 1024);
  if (usageMB === currentUsage) {
    return;
  }
  currentUsage = usageMB;
  console.log('Memory usage:', usageMB, 'MB');
}, 500);