# variables.tf - Defines configurable input variables for our infrastructure

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of SSH key pair created in AWS console"
  type        = string
  default     = "task-queue-key"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID in ap-south-1 region"
  type        = string
  default     = "ami-00bb6a80f01f03502" # Official Canonical Ubuntu 22.04 LTS for ap-south-1
}
