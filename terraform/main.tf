terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloud_run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "api_repo" {
  location      = var.region
  repository_id = var.artifact_registry_repository
  description   = "Docker repository for Storytelling Primer API"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry_api]
}

# Build and push API Docker image to Artifact Registry
resource "null_resource" "docker_build_push" {
  triggers = {
    # Rebuild if any of these files change
    dockerfile_hash = filemd5("${path.module}/../api/Dockerfile")
    app_hash        = filemd5("${path.module}/../api/app.py")
    requirements    = filemd5("${path.module}/../api/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      gcloud auth configure-docker ${var.region}-docker.pkg.dev
      docker build --platform=linux/amd64 --provenance=false -f api/Dockerfile -t ${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.service_name}:${var.image_tag} .
      docker push ${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.service_name}:${var.image_tag}
    EOT
  }

  depends_on = [google_artifact_registry_repository.api_repo]
}

# Build and push frontend Docker image to Artifact Registry
resource "null_resource" "frontend_docker_build_push" {
  triggers = {
    # Rebuild if any of these files change
    dockerfile_hash = filemd5("${path.module}/../frontend/Dockerfile")
    package_json    = filemd5("${path.module}/../frontend/package.json")
    # Add a hash of the src directory to trigger rebuilds on code changes
    src_hash = sha256(join("", [for f in fileset("${path.module}/../frontend/src", "**") : fileexists("${path.module}/../frontend/src/${f}") ? filemd5("${path.module}/../frontend/src/${f}") : ""]))
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      gcloud auth configure-docker ${var.region}-docker.pkg.dev
      docker build --platform=linux/amd64 --provenance=false -f frontend/Dockerfile -t ${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.frontend_service_name}:${var.image_tag} .
      docker push ${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.frontend_service_name}:${var.image_tag}
    EOT
  }

  depends_on = [google_artifact_registry_repository.api_repo]
}

# Cloud Run service
resource "google_cloud_run_v2_service" "api" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      name  = "api"
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.service_name}:${var.image_tag}"

      ports {
        container_port = 8080
      }

      env {
        name  = "API_PORT"
        value = "8080"
      }

      env {
        name  = "PYTHONUNBUFFERED"
        value = "1"
      }

      # Set Anthropic API key from secret or variable
      env {
        name  = "ANTHROPIC_API_KEY"
        value = var.anthropic_api_key
      }

      # Datadog configuration for the application
      env {
        name  = "DD_AGENT_HOST"
        value = "datadog-agent"
      }

      env {
        name  = "DD_ENV"
        value = var.dd_env
      }

      env {
        name  = "DD_SERVICE"
        value = "pdaas-api"
      }

      env {
        name  = "DD_VERSION"
        value = "1.0.0"
      }

      env {
        name  = "DD_SOURCE"
        value = "python"
      }

      env {
        name  = "DD_SITE"
        value = var.dd_site
      }

      env {
        name  = "DD_RUNTIME_METRICS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_INJECTION"
        value = "true"
      }

      env {
        name  = "DD_PROFILING_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LLMOBS_ENABLED"
        value = "1"
      }

      env {
        name  = "DD_LLMOBS_ML_APP"
        value = "pdaas-api"
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }
    }

    # Datadog agent sidecar
    containers {
      name  = "datadog-agent"
      image = var.datadog_agent_image

      env {
        name  = "DD_API_KEY"
        value = var.dd_api_key
      }

      env {
        name  = "DD_ENV"
        value = var.dd_env
      }

      env {
        name  = "DD_SITE"
        value = var.dd_site
      }

      env {
        name  = "DD_LOGS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL"
        value = "true"
      }

      env {
        name  = "DD_DOGSTATSD_NON_LOCAL_TRAFFIC"
        value = "true"
      }

      env {
        name  = "DD_APM_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_APM_NON_LOCAL_TRAFFIC"
        value = "true"
      }

      env {
        name  = "ECS_FARGATE"
        value = "true"
      }

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    timeout = "300s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.cloud_run_api,
    null_resource.docker_build_push
  ]
}

# Allow unauthenticated access to the API Cloud Run service
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Frontend Cloud Run service
resource "google_cloud_run_v2_service" "frontend" {
  name     = var.frontend_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      name  = "frontend"
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.frontend_service_name}:${var.image_tag}"

      ports {
        container_port = 80
      }

      # Pass the API URL to the frontend
      env {
        name  = "VITE_API_BASE_URL"
        value = google_cloud_run_v2_service.api.uri
      }

      # Datadog configuration for the frontend application
      env {
        name  = "DD_AGENT_HOST"
        value = "datadog-agent"
      }

      env {
        name  = "DD_ENV"
        value = var.dd_env
      }

      env {
        name  = "DD_SERVICE"
        value = "pdaas-frontend"
      }

      env {
        name  = "DD_VERSION"
        value = "1.0.0"
      }

      env {
        name  = "DD_SOURCE"
        value = "javascript"
      }

      env {
        name  = "DD_SITE"
        value = var.dd_site
      }

      env {
        name  = "DD_RUNTIME_METRICS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_INJECTION"
        value = "true"
      }

      env {
        name  = "DD_PROFILING_ENABLED"
        value = "true"
      }

      resources {
        limits = {
          cpu    = var.frontend_cpu_limit
          memory = var.frontend_memory_limit
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }
    }

    # Datadog agent sidecar
    containers {
      name  = "datadog-agent"
      image = var.datadog_agent_image

      env {
        name  = "DD_API_KEY"
        value = var.dd_api_key
      }

      env {
        name  = "DD_ENV"
        value = var.dd_env
      }

      env {
        name  = "DD_SITE"
        value = var.dd_site
      }

      env {
        name  = "DD_LOGS_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL"
        value = "true"
      }

      env {
        name  = "DD_DOGSTATSD_NON_LOCAL_TRAFFIC"
        value = "true"
      }

      env {
        name  = "DD_APM_ENABLED"
        value = "true"
      }

      env {
        name  = "DD_APM_NON_LOCAL_TRAFFIC"
        value = "true"
      }

      env {
        name  = "ECS_FARGATE"
        value = "true"
      }

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
      }
    }

    scaling {
      min_instance_count = var.frontend_min_instances
      max_instance_count = var.frontend_max_instances
    }

    timeout = "300s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.cloud_run_api,
    null_resource.frontend_docker_build_push,
    google_cloud_run_v2_service.api
  ]
}

# Allow unauthenticated access to the frontend Cloud Run service
resource "google_cloud_run_v2_service_iam_member" "frontend_public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
