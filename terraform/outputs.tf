# outputs.tf - Displays key information after infrastructure deployment

output "ec2_public_ip" {
  description = "Static elastic IP"
  value       = aws_eip.task_queue_eip.public_ip
}

output "ssh_command" {
  description = "Command to SSH into EC2 server"
  value       = "ssh -i task-queue-key.pem ubuntu@${aws_eip.task_queue_eip.public_ip}"
}

output "fastapi_api_docs" {
  description = "FastAPI Swagger Documentation URL"
  value       = "http://${aws_eip.task_queue_eip.public_ip}:8000/docs"
}
