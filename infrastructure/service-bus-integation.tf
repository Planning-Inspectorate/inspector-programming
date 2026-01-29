data "azurerm_servicebus_namespace" "odw" {
  name                = var.odw_config.service_bus_name
  resource_group_name = var.odw_config.resource_group_name

  provider = azurerm.odw
}

data "azurerm_servicebus_topic" "inspectors_scheduling" {
  name         = var.sb_topic_names.inspectors_scheduling
  namespace_id = data.azurerm_servicebus_namespace.odw.id

  provider = azurerm.odw
}

data "azurerm_virtual_network" "odw" {
  name                = var.odw_config.vnet_name
  resource_group_name = var.odw_config.resource_group_name

  provider = azurerm.odw
}

data "azurerm_private_dns_zone" "service_bus" {
  name                = "privatelink.servicebus.windows.net"
  resource_group_name = var.odw_config.resource_group_name

  provider = azurerm.odw
}

resource "azurerm_virtual_network_peering" "inspector_to_odw" {
  name                      = "${local.org}-peer-${local.service_name}-to-odw-${var.environment}"
  resource_group_name       = azurerm_resource_group.primary.name
  virtual_network_name      = azurerm_virtual_network.main.name
  remote_virtual_network_id = data.azurerm_virtual_network.odw.id
}

resource "azurerm_virtual_network_peering" "odw_to_inspector" {
  name                      = "${local.org}-peer-odw-to-${local.resource_suffix}"
  remote_virtual_network_id = azurerm_virtual_network.main.id
  resource_group_name       = var.odw_infra_config.resource_group_name
  virtual_network_name      = var.odw_infra_config.vnet_name

  provider = azurerm.odw
}

resource "azurerm_private_dns_zone_virtual_network_link" "vnet_a_dns_link" {
  name                  = "link-vnet-a-to-sb-dns"
  resource_group_name   = data.azurerm_private_dns_zone.service_bus.resource_group_name
  private_dns_zone_name = data.azurerm_private_dns_zone.service_bus.name
  virtual_network_id    = data.azurerm_virtual_network.odw.id
}

resource "azurerm_servicebus_subscription" "inspectors_scheduling" {
  name                                 = "inspectors-scheduling"
  topic_id                             = data.azurerm_servicebus_topic.pins_inspector.id
  max_delivery_count                   = 10
  dead_lettering_on_message_expiration = true
  default_message_ttl                  = var.sb_ttl.default
}
