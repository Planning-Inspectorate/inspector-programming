# Infrastructure

This folder contains the infrastructure-as-code (using Terraform) for this project.

## Pipelines

There are two pipelines, one for static checks during PR, and one to plan and apply the infrastructure. These are based on common-pipeline-templates.

## Environments

Differences between environments are managed with simple tfvars files, found in the `environments` folder.

State File Container Name: `pinssttfstateuksscheduli` (tooling sub)

## Common Variables

Variables with common values across environments are set in the `terraform.tfvars` file, which Terraform looks for automatically.

<https://developer.hashicorp.com/terraform/language/values/variables#variable-definitions-tfvars-files>

## Service Bus Integration

- It will need to be able to see CBOS - a data block should do, and a config var containing the BO values?
