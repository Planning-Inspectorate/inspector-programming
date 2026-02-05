resource "azurerm_servicebus_subscription" "inspectors_scheduling" {
  name                                 = "inspectors-scheduling-sub"
  topic_id                             = data.azurerm_servicebus_topic.inspectors_scheduling.id
  max_delivery_count                   = 1
  dead_lettering_on_message_expiration = true
  default_message_ttl                  = var.sb_ttl.inspectors_scheduling
}

resource "azurerm_servicebus_subscription_rule" "inspectors_scheduling" { # This rule may not be needed
  name            = "inspectors-scheduling-rule"
  subscription_id = azurerm_servicebus_subscription.inspectors_scheduling.id
  filter_type     = "CorrelationFilter" # Unsure on this value required
  correlation_filter {
    properties = {
      type = "Update" # Unsure on this value required
    }
  }
}
