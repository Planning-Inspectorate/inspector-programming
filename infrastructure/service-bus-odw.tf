data "azurerm_servicebus_namespace" "odw" {
  name                = var.odw_config.service_bus_name
  resource_group_name = var.odw_config.resource_group_name

  provider = azurerm.odw
}

data "azurerm_servicebus_topic" "inspectors" {
  name         = var.service_bus_config.topics.inspectors
  namespace_id = data.azurerm_servicebus_namespace.odw.id

  provider = azurerm.odw
}


resource "azurerm_servicebus_subscription" "inspectors_scheduling" {
  name                                 = "inspectors-scheduling-sub"
  topic_id                             = data.azurerm_servicebus_topic.inspectors.id
  max_delivery_count                   = 1
  dead_lettering_on_message_expiration = true
  default_message_ttl                  = var.service_bus_config.ttl.inspectors
}

resource "azurerm_role_assignment" "inspectors_receiver" {
  scope                = azurerm_servicebus_subscription.inspectors_scheduling.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = module.function_integration.principal_id
}
