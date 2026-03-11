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
  default_message_ttl                  = var.service_bus_config.ttl
}

resource "azurerm_role_assignment" "inspectors_receiver" {
  scope                = azurerm_servicebus_subscription.inspectors_scheduling.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = module.function_integration.principal_id
}

data "azurerm_virtual_network" "odw" {
  count               = var.odw_config == null ? 0 : 1
  name                = var.odw_config.network_name
  resource_group_name = var.odw_config.network_resource_group_name

  provider = azurerm.odw
}

# peer to ODW VNET for integration
resource "azurerm_virtual_network_peering" "scheduling_to_odw" {
  count                     = var.odw_config == null ? 0 : 1
  name                      = "${local.org}-peer-${local.service_name}-to-odw-${var.environment}"
  remote_virtual_network_id = data.azurerm_virtual_network.odw[0].id
  resource_group_name       = azurerm_virtual_network.main.resource_group_name
  virtual_network_name      = azurerm_virtual_network.main.name
}

resource "azurerm_virtual_network_peering" "odw_to_scheduling" {
  count                     = var.odw_config == null ? 0 : 1
  name                      = "${local.org}-peer-odw-to-${local.service_name}-${var.environment}"
  remote_virtual_network_id = azurerm_virtual_network.main.id
  resource_group_name       = var.odw_config.network_resource_group_name
  virtual_network_name      = var.odw_config.network_name

  provider = azurerm.odw
}