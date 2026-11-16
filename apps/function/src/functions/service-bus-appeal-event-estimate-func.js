import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleAppealEventEstimateMessage } from './service-bus-appeal-event-estimate/impl.js';

const service = initialiseService();

app.serviceBusTopic('service-bus-appeal-event-estimate', {
	topicName: service.appealEventEstimateServiceBusConfig.topic,
	subscriptionName: service.appealEventEstimateServiceBusConfig.subscription,
	connection: 'AppealsServiceBusConnection',
	handler: buildHandleAppealEventEstimateMessage(service)
});
