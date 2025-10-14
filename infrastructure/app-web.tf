module "app_web" {
  #checkov:skip=CKV_TF_1: Use of commit hash are not required for our Terraform modules
  source = "github.com/Planning-Inspectorate/infrastructure-modules.git//modules/node-app-service?ref=1.53"

  resource_group_name = azurerm_resource_group.primary.name
  location            = module.primary_region.location

  # naming
  app_name        = "web"
  resource_suffix = var.environment
  service_name    = local.service_name
  tags            = local.tags

  # service plan & scaling
  app_service_plan_id                  = azurerm_service_plan.apps.id
  app_service_plan_resource_group_name = azurerm_resource_group.primary.name
  worker_count                         = 1 # don't need to scale this app

  # container
  container_registry_name = var.tooling_config.container_registry_name
  container_registry_rg   = var.tooling_config.container_registry_rg
  image_name              = "scheduling/web"

  # networking
  app_service_private_dns_zone_id = data.azurerm_private_dns_zone.app_service.id
  inbound_vnet_connectivity       = var.apps_config.private_endpoint_enabled
  integration_subnet_id           = azurerm_subnet.apps.id
  endpoint_subnet_id              = azurerm_subnet.main.id
  outbound_vnet_connectivity      = true
  # public access via Front Door
  front_door_restriction = true
  public_network_access  = true

  # monitoring
  action_group_ids                  = local.action_group_ids
  log_analytics_workspace_id        = azurerm_log_analytics_workspace.main.id
  monitoring_alerts_enabled         = var.alerts_enabled
  health_check_path                 = "/health"
  health_check_eviction_time_in_min = var.health_check_eviction_time_in_min

  app_settings = {
    APPLICATIONINSIGHTS_CONNECTION_STRING      = local.key_vault_refs["app-insights-connection-string"]
    ApplicationInsightsAgent_EXTENSION_VERSION = "~3"
    NODE_ENV                                   = var.apps_config.node_environment
    ENVIRONMENT                                = var.environment

    API_MOCK_DATA                        = var.apps_config.api.mock_data
    API_CALENDAR_EVENTS_DAY_RANGE        = var.apps_config.api.events.days_past
    API_CALENDAR_EVENTS_FROM_DATE_OFFSET = var.apps_config.api.events.days_future
    APP_HOSTNAME                         = var.web_domains.web
    AUTH_GROUP_APPLICATION_ACCESS        = var.apps_config.auth.group_application_access
    AZURE_CLIENT_ID                      = var.apps_config.auth.client_id
    AZURE_CLIENT_SECRET                  = local.key_vault_refs["scheduling-client-secret"]
    AZURE_TENANT_ID                      = data.azurerm_client_config.current.tenant_id

    # cbos
    CBOS_API_URL = "https://${data.azurerm_linux_web_app.cbos_api.default_hostname}"
    CBOS_URL     = var.apps_config.cbos.cbos_url

    # Entra groups
    API_INSPECTOR_ENTRA_GROUPS   = join(",", var.apps_config.auth.groups.api_inspector_groups)
    ENTRA_GROUP_ID_INSPECTORS    = var.apps_config.auth.groups.inspectors
    ENTRA_GROUP_ID_TEAM_LEADS    = var.apps_config.auth.groups.team_leads
    ENTRA_GROUP_ID_NATIONAL_TEAM = var.apps_config.auth.groups.national_team

    # Gov Notify
    GOV_NOTIFY_API_KEY                                       = local.key_vault_refs["scheduling-gov-notify-api-key"]
    GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE                        = var.apps_config.gov_notify.template_ids.assigned_case
    GOV_NOTIFY_TEMPLATE_ASSIGNED_CASE_PROGRAMME_OFFICER      = var.apps_config.gov_notify.template_ids.assigned_case_programme_officer
    GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE                   = var.apps_config.gov_notify.template_ids.self_assigned_case
    GOV_NOTIFY_TEMPLATE_SELF_ASSIGNED_CASE_PROGRAMME_OFFICER = var.apps_config.gov_notify.template_ids.self_assigned_case_programme_officer

    # logging
    LOG_LEVEL = var.apps_config.logging.level

    # database connection
    SQL_CONNECTION_STRING = local.key_vault_refs["sql-app-connection-string"]

    # sessions
    REDIS_CONNECTION_STRING = local.key_vault_refs["redis-connection-string"]
    SESSION_SECRET          = local.key_vault_refs["session-secret-web"]

    # OS API
    OS_API_KEY = local.key_vault_refs["os-api-key"]
  }

  providers = {
    azurerm         = azurerm
    azurerm.tooling = azurerm.tooling
  }
}

## RBAC for secrets
resource "azurerm_role_assignment" "app_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.app_web.principal_id
}

## RBAC for secrets (staging slot)
resource "azurerm_role_assignment" "app_web_staging_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.app_web.staging_principal_id
}

## sessions
resource "random_password" "web_session_secret" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "web_session_secret" {
  #checkov:skip=CKV_AZURE_41: TODO: Secret rotation
  key_vault_id = azurerm_key_vault.main.id
  name         = "${local.service_name}-web-session-secret"
  value        = random_password.web_session_secret.result
  content_type = "session-secret"

  tags = local.tags
}
