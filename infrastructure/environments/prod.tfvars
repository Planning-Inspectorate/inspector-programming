# A-Z

apps_config = {
  app_service_plan = {
    sku                      = "P1v3"
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
    mock_data = false
  }

  auth = {
    client_id                = "d26a7ba3-6f35-4ab6-b395-7e1e971ab6c7"
    group_application_access = "128f1af5-2438-443b-bec0-99e93e3989d0"
    groups = { # TODO - set these
      inspectors           = ""
      team_leads           = ""
      national_team        = ""
      api_inspector_groups = []
    }
  }

  cbos = {
    api_app_name = "pins-app-appeals-bo-api-prod"
    api_app_rg   = "pins-rg-appeals-bo-prod"
  }

  functions_node_version = 22

  gov_notify = {
    template_ids = {
      assigned_case                        = ""
      assigned_case_programme_officer      = ""
      self_assigned_case                   = ""
      self_assigned_case_programme_officer = ""
    }
  }

  logging = {
    level = "warn"
  }

  redis = {
    capacity = 1
    family   = "C"
    sku_name = "Basic"
  }
}

common_config = {
  resource_group_name = "pins-rg-common-prod-ukw-001"
  action_group_names = {
    iap      = "pins-ag-odt-iap-prod"
    its      = "pins-ag-odt-its-prod"
    info_sec = "pins-ag-odt-info-sec-prod"
  }
}

environment = "prod"

front_door_config = {
  name        = "pins-fd-common-prod"
  rg          = "pins-rg-common-prod"
  ep_name     = "pins-fde-scheduling-prod"
  use_tooling = false
}


sql_config = {
  admin = {
    login_username = "pins-inspector-programming-sql-prod"
    object_id      = "a18d231c-c6b3-4ee0-baf3-5f2b757b8d21"
  }
  sku_name    = "S0"
  max_size_gb = 100
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

web_domains = {
  web = "casework-programming.planninginspectorate.gov.uk"
}

vnet_config = {
  address_space                       = "10.30.12.0/22"
  apps_subnet_address_space           = "10.30.12.0/24"
  main_subnet_address_space           = "10.30.13.0/24"
  secondary_address_space             = "10.30.28.0/22"
  secondary_apps_subnet_address_space = "10.30.28.0/24"
  secondary_subnet_address_space      = "10.30.29.0/24"
}

waf_rate_limits = {
  enabled             = true
  duration_in_minutes = 5
  threshold           = 1500
}
