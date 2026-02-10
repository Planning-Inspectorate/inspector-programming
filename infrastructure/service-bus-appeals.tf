data "azurerm_servicebus_namespace" "appeals" {
  name                = var.manage_appeals_config.service_bus_name
  resource_group_name = var.manage_appeals_config.resource_group_name
}

data "azurerm_servicebus_topic" "appeal_has" {
  name         = var.service_bus_config.topics.appeal_has
  namespace_id = data.azurerm_servicebus_namespace.appeals.id
}

data "azurerm_servicebus_topic" "appeal_s78" {
  name         = var.service_bus_config.topics.appeal_s78
  namespace_id = data.azurerm_servicebus_namespace.appeals.id
}

resource "azurerm_servicebus_subscription" "appeal_has" {
  name                                 = "appeal-has-scheduling-sub"
  topic_id                             = data.azurerm_servicebus_topic.appeal_has.id
  max_delivery_count                   = 1
  dead_lettering_on_message_expiration = true
  default_message_ttl                  = var.service_bus_config.ttl
}

resource "azurerm_servicebus_subscription" "appeal_s78" {
  name                                 = "appeal-s78-scheduling-sub"
  topic_id                             = data.azurerm_servicebus_topic.appeal_s78.id
  max_delivery_count                   = 1
  dead_lettering_on_message_expiration = true
  default_message_ttl                  = var.service_bus_config.ttl
}

resource "azurerm_role_assignment" "appeal_has_receiver" {
  scope                = azurerm_servicebus_subscription.appeal_has.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = module.function_integration.principal_id
}

resource "azurerm_role_assignment" "appeal_s78_receiver" {
  scope                = azurerm_servicebus_subscription.appeal_s78.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = module.function_integration.principal_id
}
