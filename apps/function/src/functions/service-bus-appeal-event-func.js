import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleAppealEventMessage } from './service-bus-appeal-event/impl.js';

const service = initialiseService();

app.serviceBusTopic('service-bus-appeal-event', {
	topicName: service.appealEventServiceBusConfig.topic,
	subscriptionName: service.appealEventServiceBusConfig.subscription,
	connection: 'AppealsServiceBusConnection',
	handler: buildHandleAppealEventMessage(service)
});
