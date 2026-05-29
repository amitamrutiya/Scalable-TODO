# Custom Jenkins image with Docker CLI, AWS CLI, kubectl, and Node.js 20
# All tools the Jenkinsfile needs are baked in — no host dependencies.

FROM jenkins/jenkins:lts-jdk17

USER root

# ── Docker CLI (for docker build / docker push) ─────────────────────────────
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
        -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) \
          signed-by=/etc/apt/keyrings/docker.asc] \
          https://download.docker.com/linux/debian \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli unzip && \
    rm -rf /var/lib/apt/lists/*

# ── AWS CLI v2 ───────────────────────────────────────────────────────────────
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
        -o /tmp/awscliv2.zip && \
    unzip -q /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/aws /tmp/awscliv2.zip

# ── kubectl (latest stable) ──────────────────────────────────────────────────
RUN KUBECTL_VER=$(curl -fsSL https://dl.k8s.io/release/stable.txt) && \
    curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VER}/bin/linux/amd64/kubectl" \
        -o /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl

# ── Node.js 20 (for npm ci / npm test in pipeline stages) ───────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

USER jenkins
