locals {
  integration_functions = {
    "odw-inspectors-message" : "ODW Inspectors",
    "service-bus-appeal-event" : "Manage appeals - appeal-event",
    "service-bus-cases-has" : "Manage appeals - appeal-has case",
    "service-bus-cases-s78" : "Manage appeals - appeal-s78 case"
  }
}

# Alert on integration function failures
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "integration_function_failures" {
  for_each = local.integration_functions

  name         = "Programme appeals integration failure for ${each.value} - ${local.resource_suffix}"
  display_name = "Programme appeals integration failure for ${each.value} - ${local.resource_suffix}"
  description  = "Triggered when the integration function app logs any function execution failures."

  location            = module.primary_region.location
  resource_group_name = azurerm_resource_group.primary.name
  scopes              = [azurerm_application_insights.main.id]

  enabled                 = var.alerts_enabled
  auto_mitigation_enabled = true

  evaluation_frequency = "PT5M"
  window_duration      = "PT10M"

  criteria {
    query                   = <<-QUERY
      requests
      | where cloud_RoleName =~ 'pins-func-scheduling-integration-${var.environment}'
      | where operation_Name =~ '${each.key}'
      | where success == False
      QUERY
    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"
  }

  severity = 1
  action {
    action_groups = [local.action_group_ids.tech]
  }

  tags = local.tags
}