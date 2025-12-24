import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleCaseMessage } from './service-bus-cases/impl.js';

const service = initialiseService();

app.serviceBusTopic('service-bus-cases-has', {
	topicName: service.caseHasServiceBusConfig.topic,
	subscriptionName: service.caseHasServiceBusConfig.subscription,
	connection: 'AppealsServiceBusConnection',
	handler: buildHandleCaseMessage(service, 'appeal-has.schema.json')
});
