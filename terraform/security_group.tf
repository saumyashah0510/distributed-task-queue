# security_group.tf - Defines firewall rules for inbound and outbound traffic

resource "aws_security_group" "task_queue_sg" {
  name        = "task-queue-security-group"
  description = "Security group for EC2 instance"

  # 1. Allow SSH access
  ingress {
    description = "Allow SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 2. Allow HTTP web traffic
  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 3. Allow FastAPI Backend API
  ingress {
    description = "Allow FastAPI port 8000"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 4. Allow all outbound traffic
  egress {
    description = "Allow All"
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "task-queue-sg"
  }
}
