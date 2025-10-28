# API Outputs
output "api_service_url" {
  description = "URL of the deployed API Cloud Run service"
  value       = google_cloud_run_v2_service.api.uri
}

output "api_service_name" {
  description = "Name of the API Cloud Run service"
  value       = google_cloud_run_v2_service.api.name
}

output "api_service_location" {
  description = "Location of the API Cloud Run service"
  value       = google_cloud_run_v2_service.api.location
}

output "api_docker_image" {
  description = "Full API Docker image path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.service_name}:${var.image_tag}"
}

# Frontend Outputs
output "frontend_service_url" {
  description = "URL of the deployed frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "frontend_service_name" {
  description = "Name of the frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.name
}

output "frontend_service_location" {
  description = "Location of the frontend Cloud Run service"
  value       = google_cloud_run_v2_service.frontend.location
}

output "frontend_docker_image" {
  description = "Full frontend Docker image path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.frontend_service_name}:${var.image_tag}"
}

# Shared Outputs
output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = google_artifact_registry_repository.api_repo.name
}

# Deprecated outputs for backward compatibility
output "service_url" {
  description = "[DEPRECATED] Use api_service_url instead. URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.api.uri
}

output "service_name" {
  description = "[DEPRECATED] Use api_service_name instead. Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.name
}

output "service_location" {
  description = "[DEPRECATED] Use api_service_location instead. Location of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.location
}

output "docker_image" {
  description = "[DEPRECATED] Use api_docker_image instead. Full Docker image path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository}/${var.service_name}:${var.image_tag}"
}
