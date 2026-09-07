# main.tf - Core infrastructure resources (EC2 Instance & Elastic IP)

resource "aws_instance" "task_queue_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.task_queue_sg.id]

  user_data = file("${path.module}/user_data.sh")

  # Configure root storage disk size (8 GB GP3 SSD - Free Tier)
  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name        = "distributed-task-queue-server"
    Environment = "Production"
  }
}


# Allocate a Static Elastic IP (EIP) and associate it with the EC2 Instance
resource "aws_eip" "task_queue_eip" {
  instance = aws_instance.task_queue_server.id
  domain   = "vpc"
  tags = {
    Name = "distributed-task-queue-eip"
  }
}
