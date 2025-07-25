# A-Z

apps_config = {
  app_service_plan = {
    sku                      = "P0v3"
    per_site_scaling_enabled = false
    worker_count             = 1
    zone_balancing_enabled   = false
  }
  node_environment         = "production"
  private_endpoint_enabled = true

  api = {
    mock_data = false
  }

  auth = {
    client_id                = "de661bed-3aad-47dc-9a57-c7ad99929856"
    group_application_access = "41cbad78-b817-45a8-9791-915c89d4b8bf"
    groups = { # TODO - set these
      inspectors           = ""
      team_leads           = ""
      national_team        = ""
      api_inspector_groups = ""
    }
  }

  logging = {
    level = "warn"
  }

  redis = {
    capacity = 0
    family   = "C"
    sku_name = "Basic"
  }
}

# auth_config_portal = {
#   auth_enabled   = true
#   auth_client_id = "8e64dbf3-99f8-4b31-94ee-b621ad68c56f"
#   application_id = "35400f77-eff9-467c-b319-7d30388ba02e"
# }

common_config = {
  resource_group_name = "pins-rg-common-training-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-training"
    its      = "pins-ag-odt-its-training"
    info_sec = "pins-ag-odt-info-sec-training"
  }
}

environment = "training"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-scheduling"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-inspector-programming-sql-training"
    object_id      = "5c38c03b-daee-4465-af10-3dbae7ec4ee5"
  }
  sku_name    = "Basic"
  max_size_gb = 2
  retention = {
    audit_days             = 7
    short_term_days        = 7
    long_term_weekly       = "P1W"
    long_term_monthly      = "P1M"
    long_term_yearly       = "P1Y"
    long_term_week_of_year = 1
  }
  public_network_access_enabled = false
}

vnet_config = {
  address_space                       = "10.30.8.0/22"
  apps_subnet_address_space           = "10.30.8.0/24"
  main_subnet_address_space           = "10.30.9.0/24"
  secondary_address_space             = "10.30.24.0/22"
  secondary_apps_subnet_address_space = "10.30.24.0/24"
  secondary_subnet_address_space      = "10.30.25.0/24"
}

web_domains = {
  web = "scheduling-training.planninginspectorate.gov.uk"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}
