# A-Z

# apps_config = {
#   app_service_plan = {
#     sku                      = "P1v3"
#     per_site_scaling_enabled = true
#     worker_count             = 3
#     zone_balancing_enabled   = true
#   }
#   node_environment         = "production"
#   private_endpoint_enabled = true

#   auth = {
#     client_id                = "30a34d1a-473e-4a7f-ad6d-fa574c52a509"
#     group_application_access = "1abf7720-2ea6-479e-822d-218917d3d0ee"
#   }

#   contact_email = "schedulingapplications@planninginspectorate.gov.uk"

#   entra = {
#     group_ids = {
#       case_officers = "1abf7720-2ea6-479e-822d-218917d3d0ee"
#       inspectors    = "dfcab300-f268-4eb3-820e-1758fa69c150"
#     }
#   }

#   feature_flags = {
#     portal_not_live      = true
#     upload_docs_not_live = true
#   }

#   google_analytics_id = "G-HP9Q7SY3N8"

#   logging = {
#     level = "warn"
#   }

#   redis = {
#     capacity = 1
#     family   = "C"
#     sku_name = "Standard" ################### NEEDED?????????????????
#   }

#   gov_notify = {
#     disabled = true
#     templates = {
#       test_template_id                = "" # TODO
#       pre_ack_template_id             = "c61134de-6fb5-4fd5-8f4a-d3707a9c15df"
#       ack_rep_template_id             = "" # TODO
#       lpa_qnr_template_id             = "" # TODO
#       app_rec_with_fee_template_id    = "" # TODO
#       app_rec_without_fee_template_id = "" # TODO
#       app_not_nat_imp_template_id     = "" # TODO
#     }
#   }

#   sharepoint = {
#     disabled = false
#   }
# }

# auth_config_portal = {
#   auth_enabled   = false
#   auth_client_id = "8e64dbf3-99f8-4b31-94ee-b621ad68c56f"
#   application_id = "da6cd57b-3b80-49f3-afdf-ab76bf1a6d1b"
# }

# common_config = {
#   resource_group_name = "pins-rg-common-prod-ukw-001" # South or West?
#   action_group_names = {
#     iap      = "pins-ag-odt-iap-prod"
#     its      = "pins-ag-odt-its-prod"
#     info_sec = "pins-ag-odt-info-sec-prod"
#   }
# }

environment = "prod"

# front_door_config = {
#   name        = "pins-fd-common-prod"
#   rg          = "pins-rg-common-prod"
#   ep_name     = "pins-fde-scheduling-prod"
#   use_tooling = false
# }

# monitoring_config = {
#   app_insights_web_test_enabled = true
# }

# sql_config = {
#   admin = {
#     login_username = "pins-scheduling-sql-prod"
#     object_id      = "00d052c3-0a51-4f7d-93fc-7c366877aed6"
#   }
#   sku_name    = "S1"
#   max_size_gb = 100
#   retention = {
#     audit_days             = 7
#     short_term_days        = 7
#     long_term_weekly       = "P1W"
#     long_term_monthly      = "P1M"
#     long_term_yearly       = "P1Y"
#     long_term_week_of_year = 1
#   }
#   public_network_access_enabled = false
# }

# web_domains = "https://casework-programming.planninginspectorate.gov.uk"

vnet_config = {
  address_space                       = "10.30.12.0/22"
  apps_subnet_address_space           = "10.30.12.0/24"
  main_subnet_address_space           = "10.30.13.0/24"
  secondary_address_space             = "10.30.28.0/22"
  secondary_apps_subnet_address_space = "10.30.28.0/24"
  secondary_subnet_address_space      = "10.30.29.0/24"
}

# waf_rate_limits = {
#   enabled             = true
#   duration_in_minutes = 5
#   threshold           = 1500
# }
