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

  api = {
    events = {
      days_past   = 30
      days_future = 7
    }
    mock_data = false
  }

  auth = {
    client_id                = "18150378-c026-4833-af9a-fef6e6dbc70d"
    group_application_access = "c1232a02-e4c5-4ac4-9efd-14f05e597023"
    groups = {
      inspectors    = "b9dbe461-04fe-43b3-b3c3-bbb6407d624f"
      team_leads    = "5d68af6f-3c26-4216-bd2d-16805e070d2e"
      national_team = "75ed385c-6351-4065-8280-463d4bb86e61"
      api_inspector_groups = [
        "de84d4ca-279b-4e43-bab0-6417bfb4e06a",
        "bb3853ea-2e2d-49e0-8b9a-449a31e27bb4",
        "6f59e9c5-dd46-4bd4-ab92-f576dcc29b48"
      ]
    }
  }

  cbos = {
    api_app_name = "pins-app-appeals-bo-api-dev"
    api_app_rg   = "pins-rg-appeals-bo-dev"
  }

  functions_node_version = 22

  gov_notify = {
    template_ids = {
      assigned_case                        = "6dc1cb2f-4ae6-4dfc-8815-22e09601c91c"
      assigned_case_programme_officer      = "6dc1cb2f-4ae6-4dfc-8815-22e09601c91c"
      self_assigned_case                   = "6dc1cb2f-4ae6-4dfc-8815-22e09601c91c"
      self_assigned_case_programme_officer = "6dc1cb2f-4ae6-4dfc-8815-22e09601c91c"
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
    login_username = "pins-inspector-programming-sql-dev"
    object_id      = "519c661d-c6d9-47e7-8560-7dbe98043ceb"
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
