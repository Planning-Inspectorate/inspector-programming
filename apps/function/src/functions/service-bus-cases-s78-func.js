import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleCaseMessage } from './service-bus-cases/impl.js';

const service = initialiseService();

app.serviceBusTopic('service-bus-cases-s78', {
	topicName: service.caseS78ServiceBusConfig.topic,
	subscriptionName: service.caseS78ServiceBusConfig.subscription,
	connection: 'AppealsServiceBusConnection',
	handler: buildHandleCaseMessage(service, 'appeal-s78.schema.json')
});
