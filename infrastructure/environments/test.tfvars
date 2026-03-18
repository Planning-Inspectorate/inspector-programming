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
    events = {
      days_past   = 30
      days_future = 7
    }
    mock_data = true
  }

  auth = {
    client_id                = "d014bf1d-a98d-4db8-999d-cb58834b5ae1"
    group_application_access = "bee16f0c-7e6f-49e3-823c-2a2b88301b8e"
    groups = {
      inspectors           = "3f0aad75-f5f5-4da3-a6a7-339eca969bbd"
      team_leads           = "524778a3-88b3-4d23-94e2-08d67c6efa16"
      national_team        = "67442451-77be-4173-a61a-32f3590e0d33"
      api_inspector_groups = []
    }
  }

  functions_node_version = 22

  gov_notify = {
    template_ids = {
      assigned_case                        = "c99895a2-1a6a-4278-be7f-fc1628dbd0ab"
      assigned_case_programme_officer      = "cc9a7b28-e997-437e-9a90-adf7e6e97f73"
      self_assigned_case                   = "564f2675-1420-42c7-a890-215776bbb498"
      self_assigned_case_programme_officer = "c99895a2-1a6a-4278-be7f-fc1628dbd0ab"
    }
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

manage_appeals_config = {
  api_app_name        = "pins-app-appeals-bo-api-test"
  network_name        = "pins-vnet-appeals-bo-test"
  resource_group_name = "pins-rg-appeals-bo-test"
  service_bus_name    = "pins-sb-appeals-bo-test"
  web_app_url         = "https://back-office-appeals-test.planninginspectorate.gov.uk/"
}

monitoring_config = {
  web_app_insights_web_test_enabled = false
  log_daily_cap                     = 0.2
}

odw_config = {
  network_resource_group_name = "pins-rg-network-odw-test-uks"
  network_name                = "vnet-odw-test-uks"
  subscription_id             = "6b18ba9d-2399-48b5-a834-e0f267be122d"
  resource_group_name         = "pins-rg-ingestion-odw-test-uks"
  service_bus_name            = "pins-sb-odw-test-uks-hk2zun"
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
