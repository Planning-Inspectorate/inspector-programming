# variables should be sorted A-Z

variable "alerts_enabled" {
  description = "Whether to enable Azure Monitor alerts"
  type        = string
  default     = true
}

variable "apps_config" {
  description = "Config for the apps"
  type = object({
    app_service_plan = object({
      sku                      = string
      per_site_scaling_enabled = bool
      worker_count             = number
      zone_balancing_enabled   = bool
    })
    node_environment         = string
    private_endpoint_enabled = bool

    auth = object({
      client_id                = string
      group_application_access = string
    })

    contact_email = string

    entra = object({
      group_ids = object({
        case_officers = string
        inspectors    = string
      })
    })

    feature_flags = object({
      # portal_not_live      = bool
      upload_docs_not_live = bool
    })

    google_analytics_id = string

    logging = object({
      level = string
    })

    redis = object({
      capacity = number
      family   = string
      sku_name = string
    })

    # gov_notify = object({
    #   disabled = bool
    #   templates = object({
    #     test_template_id                = string
    #     pre_ack_template_id             = string
    #     ack_rep_template_id             = string
    #     lpa_qnr_template_id             = string
    #     app_rec_with_fee_template_id    = string
    #     app_rec_without_fee_template_id = string
    #     app_not_nat_imp_template_id     = string
    #   })
    # })

    sharepoint = object({
      disabled = bool
    })
  })
}

# variable "auth_config_portal" {
#   description = "Config for the azure authentication scheduling portal"
#   type = object({
#     auth_enabled   = bool
#     auth_client_id = string
#     application_id = string
#   })
# }

variable "common_config" {
  description = "Config for the common resources, such as action groups"
  type = object({
    resource_group_name = string
    action_group_names = object({
      iap      = string
      its      = string
      info_sec = string
    })
  })
}

variable "environment" {
  description = "The name of the environment in which resources will be deployed"
  type        = string
}

# variable "front_door_config" {
#   description = "Config for the frontdoor in tooling subscription"
#   type = object({
#     name        = string
#     rg          = string
#     ep_name     = string
#     use_tooling = bool
#   })
# }

variable "health_check_eviction_time_in_min" {
  description = "The eviction time in minutes for the health check"
  type        = number
  default     = 10
}

# variable "monitoring_config" {
#   description = "Config for monitoring"
#   type = object({
#     app_insights_web_test_enabled = bool
#   })
# }

variable "sql_config" {
  description = "Config for SQL Server and DB"
  type = object({
    admin = object({
      login_username = string
      object_id      = string
    })
    sku_name    = string
    max_size_gb = number
    retention = object({
      audit_days             = number
      short_term_days        = number
      long_term_weekly       = string
      long_term_monthly      = string
      long_term_yearly       = string
      long_term_week_of_year = number
    })
    public_network_access_enabled = bool
  })
}

variable "tags" {
  description = "A collection of tags to assign to taggable resources"
  type        = map(string)
  default     = {}
}

variable "tooling_config" {
  description = "Config for the tooling subscription resources"
  type = object({
    container_registry_name = string
    container_registry_rg   = string
    network_name            = string
    network_rg              = string
    subscription_id         = string
  })
}

variable "vnet_config" {
  description = "VNet configuration"
  type = object({
    address_space                       = string
    apps_subnet_address_space           = string
    main_subnet_address_space           = string
    secondary_address_space             = string
    secondary_apps_subnet_address_space = string
    secondary_subnet_address_space      = string
  })
}

# variable "waf_rate_limits" {
#   description = "Config for Service Bus"
#   type = object({
#     enabled             = bool
#     duration_in_minutes = number
#     threshold           = number
#   })
# }

variable "web_domains" {
  description = "Settings for the web app"
  type = object({
    web = string
  })
}
