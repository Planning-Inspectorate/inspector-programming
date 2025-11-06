import { app } from '@azure/functions';
import { initialiseService } from '../init.js';
import { buildHandleInspectorMessage } from './odw-inspectors/impl.js';

const service = initialiseService();

// Service Bus topic trigger - placeholder names until confirmed
// NOTE: subscriptionName required for topic triggers
app.serviceBusTopic('odw-inspectors-message', {
	topicName: service.inspectorServiceBusConfig.topic,
	subscriptionName: service.inspectorServiceBusConfig.subscription,
	connection: 'OdwServiceBusConnection',
	handler: buildHandleInspectorMessage(service)
});
