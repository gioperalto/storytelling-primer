#!/bin/bash

# Storytelling Primer API - Cloud Run Deployment Script
# This script provides a guided deployment process

set -e

echo "=========================================="
echo "Storytelling Primer API - Cloud Run Deploy"
echo "=========================================="
echo

# Check prerequisites
command -v gcloud >/dev/null 2>&1 || { echo "Error: gcloud is not installed. Please install Google Cloud SDK."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Error: terraform is not installed. Please install Terraform."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: docker is not installed. Please install Docker."; exit 1; }

echo "✓ All prerequisites met"
echo

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠ terraform.tfvars not found"
    echo "Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    echo
    echo "Please edit terraform.tfvars with your values:"
    echo "  - project_id"
    echo "  - anthropic_api_key"
    echo
    echo "Then run this script again."
    exit 1
fi

echo "✓ Configuration file found"
echo

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    terraform init
    echo
fi

# Run terraform plan
echo "Planning deployment..."
terraform plan
echo

# Prompt for confirmation
read -p "Do you want to proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Apply Terraform
echo
echo "Deploying to Cloud Run..."
terraform apply -auto-approve

# Display outputs
echo
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo
terraform output
echo

echo "Your API is now live! Visit the service_url to access it."
echo "Swagger documentation is available at: <service_url>/api/docs"
