module "function_integration" {
  #checkov:skip=CKV_TF_1: Use of commit hash are not required for our Terraform modules
  source = "github.com/Planning-Inspectorate/infrastructure-modules.git//modules/node-function-app?ref=1.54"

  resource_group_name = azurerm_resource_group.primary.name
  location            = module.primary_region.location

  # naming
  app_name        = "integration"
  resource_suffix = var.environment
  service_name    = local.service_name
  tags            = local.tags

  # service plan
  app_service_plan_id = azurerm_service_plan.apps.id

  # storage
  function_apps_storage_account            = azurerm_storage_account.functions.name
  function_apps_storage_account_access_key = azurerm_storage_account.functions.primary_access_key

  # networking
  integration_subnet_id      = azurerm_subnet.apps.id
  outbound_vnet_connectivity = true
  # use private endpoints
  inbound_vnet_connectivity = true
  private_endpoint = {
    private_dns_zone_id = data.azurerm_private_dns_zone.app_service.id
    subnet_id           = azurerm_subnet.main.id
  }

  # monitoring
  action_group_ids            = local.action_group_ids
  app_insights_instrument_key = azurerm_application_insights.main.instrumentation_key
  log_analytics_workspace_id  = azurerm_log_analytics_workspace.main.id
  monitoring_alerts_enabled   = var.alerts_enabled

  # settings
  function_node_version = var.apps_config.functions_node_version
  app_settings = {
    CBOS_API_URL          = "https://${data.azurerm_linux_web_app.cbos_api.default_hostname}"
    OS_API_KEY            = local.key_vault_refs["os-api-key"]
    SQL_CONNECTION_STRING = local.key_vault_refs["sql-app-connection-string"]

    # ODW integration
    OdwServiceBusConnection__fullyQualifiedNamespace = "${var.odw_config.service_bus_name}.servicebus.windows.net"
    SERVICE_BUS_INSPECTOR_TOPIC                      = data.azurerm_servicebus_topic.inspectors.name
    SERVICE_BUS_INSPECTOR_SUBSCRIPTION               = azurerm_servicebus_subscription.inspectors_scheduling.name

    # Manage appeals integration
    AppealsServiceBusConnection__fullyQualifiedNamespace = "${var.manage_appeals_config.service_bus_name}.servicebus.windows.net"
    SERVICE_BUS_CASE_HAS_TOPIC                           = data.azurerm_servicebus_topic.appeal_has.name
    SERVICE_BUS_CASE_HAS_SUBSCRIPTION                    = azurerm_servicebus_subscription.appeal_has.name
    SERVICE_BUS_CASE_S78_TOPIC                           = data.azurerm_servicebus_topic.appeal_s78.name
    SERVICE_BUS_CASE_S78_SUBSCRIPTION                    = azurerm_servicebus_subscription.appeal_s78.name
  }
}

## RBAC for secrets
resource "azurerm_role_assignment" "function_integration_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.function_integration.principal_id
}
