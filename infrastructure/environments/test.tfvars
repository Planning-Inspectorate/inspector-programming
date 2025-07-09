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

  auth = {
    client_id                = "d014bf1d-a98d-4db8-999d-cb58834b5ae1"
    group_application_access = "bee16f0c-7e6f-49e3-823c-2a2b88301b8e"
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
  resource_group_name = "pins-rg-common-test-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-test"
    its      = "pins-ag-odt-its-test"
    info_sec = "pins-ag-odt-info-sec-test"
  }
}

environment = "test"

front_door_config = {
  name        = "pins-fd-common-tooling"
  rg          = "pins-rg-common-tooling"
  ep_name     = "pins-fde-scheduling"
  use_tooling = true
}

sql_config = {
  admin = {
    login_username = "pins-inspector-programming-sql-test"
    object_id      = "5fd37769-97af-4f7a-8475-60ea59e232c5"
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
  address_space                       = "10.30.4.0/22"
  apps_subnet_address_space           = "10.30.4.0/24"
  main_subnet_address_space           = "10.30.5.0/24"
  secondary_address_space             = "10.30.20.0/22"
  secondary_apps_subnet_address_space = "10.30.20.0/24"
  secondary_subnet_address_space      = "10.30.21.0/24"
}

web_domains = {
  web = "scheduling-test.planninginspectorate.gov.uk"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}
