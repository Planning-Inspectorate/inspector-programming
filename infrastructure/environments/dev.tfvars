# A-Z

apps_config = {
  app_service_plan = {
    sku                      = "P0v3"
    per_site_scaling_enabled = false
    worker_count             = 1
    zone_balancing_enabled   = false
  }
  node_environment         = "development"
  private_endpoint_enabled = true

  auth = {
    client_id                = "18150378-c026-4833-af9a-fef6e6dbc70d"
    group_application_access = "c1232a02-e4c5-4ac4-9efd-14f05e597023"
  }

  logging = {
    level = "info"
  }

  redis = {
    capacity = 0
    family   = "C"
    sku_name = "Basic"
  }
}

common_config = {
  resource_group_name = "pins-rg-common-dev-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-dev"
    its      = "pins-ag-odt-its-dev"
    info_sec = "pins-ag-odt-info-sec-dev"
  }
}

environment = "dev"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-scheduling"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-scheduling-sql-dev"
    object_id      = "1c69f6a2-c0ef-42fa-b754-5da26608299f"
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
  address_space             = "10.30.0.0/22"
  apps_subnet_address_space = "10.30.0.0/24"
  main_subnet_address_space = "10.30.1.0/24"

  secondary_address_space             = "10.30.16.0/22"
  secondary_apps_subnet_address_space = "10.30.16.0/24"
  secondary_subnet_address_space      = "10.30.17.0/24"
}

web_domains = {
  web = "scheduling-dev.planninginspectorate.gov.uk"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}
