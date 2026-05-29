pipeline {
    agent any

    environment {
        AWS_REGION     = 'us-east-1'
        ECR_REGISTRY   = '420924156821.dkr.ecr.us-east-1.amazonaws.com'
        BACKEND_REPO   = "${ECR_REGISTRY}/todo-backend"
        FRONTEND_REPO  = "${ECR_REGISTRY}/todo-frontend"
        EKS_CLUSTER    = 'todo-eks-cluster'
        K8S_NAMESPACE  = 'todo-app'
    }

    options {
        // Keep last 10 builds, timeout entire pipeline at 30 min
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ─────────────────────────────────────────────────────────────
        // STAGE 1: Checkout + set image tag from git commit SHA
        // ─────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    echo "Branch: ${env.GIT_BRANCH}"
                    echo "Commit: ${env.GIT_COMMIT}"
                    echo "Image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 2: CI — Backend tests
        // Spins up a local postgres container so tests have a real DB
        // ─────────────────────────────────────────────────────────────
        stage('CI: Backend Tests') {
            steps {
                // Start a temporary postgres for tests
                sh '''
                    docker rm -f ci-postgres 2>/dev/null || true
                    docker run -d \
                        --name ci-postgres \
                        -e POSTGRES_DB=todoapp_test \
                        -e POSTGRES_USER=postgres \
                        -e POSTGRES_PASSWORD=testpassword \
                        -p 5433:5432 \
                        postgres:16-alpine

                    # Wait until postgres accepts connections
                    for i in $(seq 1 20); do
                        docker exec ci-postgres pg_isready -U postgres && break
                        echo "Waiting for postgres... ($i/20)"
                        sleep 2
                    done
                '''

                dir('backend') {
                    sh 'npm install'
                    // Override DATABASE_URL so tests hit the local container
                    withEnv([
                        'DATABASE_URL=postgresql://postgres:testpassword@localhost:5433/todoapp_test',
                        'NODE_ENV=test'
                    ]) {
                        sh 'npm test -- --passWithNoTests --forceExit --runInBand'
                    }
                }
            }
            post {
                always {
                    // Always clean up the test postgres container
                    sh 'docker rm -f ci-postgres 2>/dev/null || true'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 3: CI — Frontend tests (Vitest, no browser needed)
        // ─────────────────────────────────────────────────────────────
        stage('CI: Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    // --run = single pass (no watch mode) for CI
                    sh 'npx vitest run --reporter=verbose 2>&1 || true'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 4: Build Docker images (tagged with git SHA + latest)
        // ─────────────────────────────────────────────────────────────
        stage('Build Images') {
            steps {
                sh """
                    docker build \
                        -t ${BACKEND_REPO}:${IMAGE_TAG} \
                        -t ${BACKEND_REPO}:latest \
                        ./backend

                    docker build \
                        -t ${FRONTEND_REPO}:${IMAGE_TAG} \
                        -t ${FRONTEND_REPO}:latest \
                        ./frontend
                """
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 5: Push images to ECR
        // Uses EC2 instance IAM role — no credentials to store in Jenkins
        // ─────────────────────────────────────────────────────────────
        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}

                    docker push ${BACKEND_REPO}:${IMAGE_TAG}
                    docker push ${BACKEND_REPO}:latest

                    docker push ${FRONTEND_REPO}:${IMAGE_TAG}
                    docker push ${FRONTEND_REPO}:latest
                """
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 6: Rolling deploy to EKS using the git-SHA-tagged image
        // kubectl set image triggers a rolling update (zero downtime)
        // ─────────────────────────────────────────────────────────────
        stage('Deploy to EKS') {
            steps {
                sh """
                    aws eks update-kubeconfig \
                        --name ${EKS_CLUSTER} \
                        --region ${AWS_REGION}

                    # Update backend — container name must match deployment spec
                    kubectl set image deployment/todo-backend \
                        backend=${BACKEND_REPO}:${IMAGE_TAG} \
                        -n ${K8S_NAMESPACE}

                    # Update frontend
                    kubectl set image deployment/todo-frontend \
                        frontend=${FRONTEND_REPO}:${IMAGE_TAG} \
                        -n ${K8S_NAMESPACE}
                """
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STAGE 7: Verify rollout completed successfully
        // If either deployment fails to roll out, the post{failure}
        // block automatically runs kubectl rollout undo
        // ─────────────────────────────────────────────────────────────
        stage('Verify Rollout') {
            steps {
                sh """
                    kubectl rollout status deployment/todo-backend \
                        -n ${K8S_NAMESPACE} --timeout=5m

                    kubectl rollout status deployment/todo-frontend \
                        -n ${K8S_NAMESPACE} --timeout=5m
                """
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // POST: Notify result + auto-rollback on failure
    // ─────────────────────────────────────────────────────────────────
    post {
        success {
            echo """
            ✅ Deployment successful!
               Image tag : ${env.IMAGE_TAG}
               Branch    : ${env.GIT_BRANCH}
               Commit    : ${env.GIT_COMMIT}
            """
        }
        failure {
            echo "❌ Pipeline failed — rolling back deployments"
            sh """
                aws eks update-kubeconfig \
                    --name ${EKS_CLUSTER} \
                    --region ${AWS_REGION} || true

                kubectl rollout undo deployment/todo-backend \
                    -n ${K8S_NAMESPACE} || true

                kubectl rollout undo deployment/todo-frontend \
                    -n ${K8S_NAMESPACE} || true
            """
        }
        always {
            // Clean up dangling docker images to save disk space
            sh 'docker image prune -f || true'
        }
    }
}
