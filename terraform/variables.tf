variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "storytelling-primer-api"
}

variable "artifact_registry_repository" {
  description = "Name of the Artifact Registry repository"
  type        = string
  default     = "storytelling-primer"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude AI"
  type        = string
  sensitive   = true
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run service"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run service"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the Cloud Run service"
  type        = bool
  default     = true
}

# Frontend variables
variable "frontend_service_name" {
  description = "Name of the frontend Cloud Run service"
  type        = string
  default     = "storytelling-primer-frontend"
}

variable "frontend_cpu_limit" {
  description = "CPU limit for frontend Cloud Run service"
  type        = string
  default     = "1"
}

variable "frontend_memory_limit" {
  description = "Memory limit for frontend Cloud Run service"
  type        = string
  default     = "256Mi"
}

variable "frontend_min_instances" {
  description = "Minimum number of frontend Cloud Run instances"
  type        = number
  default     = 0
}

variable "frontend_max_instances" {
  description = "Maximum number of frontend Cloud Run instances"
  type        = number
  default     = 10
}

# Datadog variables
variable "dd_api_key" {
  description = "Datadog API key for monitoring"
  type        = string
  sensitive   = true
}

variable "dd_env" {
  description = "Datadog environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "dd_site" {
  description = "Datadog site (e.g., datadoghq.com, datadoghq.eu)"
  type        = string
  default     = "datadoghq.com"
}

variable "datadog_agent_image" {
  description = "Datadog agent Docker image"
  type        = string
  default     = "gcr.io/datadoghq/agent:latest"
}
