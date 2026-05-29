#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# jenkins-setup.sh — Build and run Jenkins in Docker on the EC2 instance
# Run once as: bash jenkins-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

EC2_PUBLIC_IP="100.54.47.214"
EC2_SG_ID="sg-0f970aec698e2b514"
AWS_REGION="us-east-1"

echo "===> Step 1: Build custom Jenkins image (with Docker CLI, AWS CLI, kubectl, Node.js)"
docker build -t jenkins-custom:latest ./jenkins/

echo "===> Step 2: Stop and remove any old Jenkins container"
docker rm -f jenkins 2>/dev/null || true

echo "===> Step 3: Start Jenkins container"
docker run -d \
  --name jenkins \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -u root \
  jenkins-custom:latest

echo "===> Step 4: Open port 8080 in EC2 security group"
aws ec2 authorize-security-group-ingress \
  --group-id "$EC2_SG_ID" \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0 \
  --region "$AWS_REGION" 2>&1 && echo "Port 8080 opened" || echo "Port 8080 rule may already exist"

echo ""
echo "===> Step 5: Wait for Jenkins to start..."
sleep 20

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Jenkins is ready!"
echo ""
echo "  URL:  http://${EC2_PUBLIC_IP}:8080"
echo ""
echo "  Initial admin password:"
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  NEXT STEPS (do these in order):"
echo ""
echo "  1. Open http://${EC2_PUBLIC_IP}:8080 in your browser"
echo "  2. Enter the password printed above"
echo "  3. Click 'Install suggested plugins' and wait"
echo "  4. Create your admin user"
echo "  5. Install extra plugins:"
echo "       Dashboard → Manage Jenkins → Plugins → Available"
echo "       Search and install: 'GitHub Integration Plugin'"
echo ""
echo "  6. Create a Pipeline job:"
echo "       New Item → Enter name 'todo-cicd' → Pipeline → OK"
echo "       → Build Triggers: check 'GitHub hook trigger for GITScm polling'"
echo "       → Pipeline section:"
echo "           Definition: Pipeline script from SCM"
echo "           SCM: Git"
echo "           Repository URL: <your GitHub repo HTTPS URL>"
echo "           Branch: */main"
echo "           Script Path: Jenkinsfile"
echo "       → Save"
echo ""
echo "  7. Add GitHub webhook:"
echo "       GitHub repo → Settings → Webhooks → Add webhook"
echo "       Payload URL:  http://${EC2_PUBLIC_IP}:8080/github-webhook/"
echo "       Content type: application/json"
echo "       Events: Just the push event → Add webhook"
echo "═══════════════════════════════════════════════════════════"
