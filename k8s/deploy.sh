#!/bin/bash

# ThesisTrack AKS Deployment Script
set -e

echo "🚀 Starting ThesisTrack deployment to AKS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_tools() {
    echo -e "${BLUE}📋 Checking required tools...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ helm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All required tools are installed${NC}"
}

# Install NGINX Ingress Controller
install_nginx_ingress() {
    echo -e "${BLUE}📦 Installing NGINX Ingress Controller...${NC}"
    
    # Add the ingress-nginx repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Install NGINX Ingress Controller
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.service.externalTrafficPolicy=Local
    
    echo -e "${YELLOW}⏳ Waiting for NGINX Ingress Controller to be ready...${NC}"
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    echo -e "${GREEN}✅ NGINX Ingress Controller installed${NC}"
}

# Install cert-manager
install_cert_manager() {
    echo -e "${BLUE}🔒 Installing cert-manager for SSL certificates...${NC}"
    
    # Add the Jetstack Helm repository
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.0 \
        --set installCRDs=true
    
    echo -e "${YELLOW}⏳ Waiting for cert-manager to be ready...${NC}"
    kubectl wait --namespace cert-manager \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    echo -e "${GREEN}✅ cert-manager installed${NC}"
}

# Get LoadBalancer IP
get_loadbalancer_ip() {
    echo -e "${BLUE}🔍 Getting LoadBalancer IP address...${NC}"
    
    # Wait for LoadBalancer to get external IP
    echo -e "${YELLOW}⏳ Waiting for LoadBalancer to get external IP...${NC}"
    
    while true; do
        EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        if [ ! -z "$EXTERNAL_IP" ] && [ "$EXTERNAL_IP" != "null" ]; then
            break
        fi
        echo "Waiting for external IP..."
        sleep 10
    done
    
    echo -e "${GREEN}✅ LoadBalancer IP: ${EXTERNAL_IP}${NC}"
    echo -e "${YELLOW}📝 Please configure your DNS to point thesistrack.dev to ${EXTERNAL_IP}${NC}"
    
    return 0
}

# Deploy ThesisTrack application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying ThesisTrack application...${NC}"
    
    # Check if values.yaml is configured
    if grep -q "your-email@example.com" thesistrack/values.yaml; then
        echo -e "${RED}❌ Please configure values.yaml with your actual values before deploying${NC}"
        echo -e "${YELLOW}Edit k8s/thesistrack/values.yaml and update:${NC}"
        echo "  - ssl.email (your email for Let's Encrypt)"
        echo "  - secrets.secretKey (generate a secure random key)"
        echo "  - secrets.googleClientId (your Google OAuth client ID)"
        echo "  - secrets.googleClientSecret (your Google OAuth client secret)"
        exit 1
    fi
    
    # Deploy with Helm
    helm upgrade --install thesistrack ./thesistrack \
        --namespace thesistrack \
        --create-namespace
    
    echo -e "${GREEN}✅ ThesisTrack application deployed${NC}"
    
    # Wait for pods to be ready
    echo -e "${YELLOW}⏳ Waiting for application pods to be ready...${NC}"
    kubectl wait --namespace thesistrack \
        --for=condition=ready pod \
        --selector=app=frontend \
        --timeout=300s
    
    kubectl wait --namespace thesistrack \
        --for=condition=ready pod \
        --selector=app=backend \
        --timeout=300s
    
    kubectl wait --namespace thesistrack \
        --for=condition=ready pod \
        --selector=app=postgres \
        --timeout=300s
    
    echo -e "${GREEN}✅ All application pods are ready${NC}"
}

# Main deployment function
main() {
    echo -e "${GREEN}🎯 ThesisTrack AKS Deployment${NC}"
    echo "=================================="
    
    check_tools
    install_nginx_ingress
    install_cert_manager
    get_loadbalancer_ip
    
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Configure your DNS to point thesistrack.dev to the LoadBalancer IP shown above"
    echo "2. Update k8s/thesistrack/values.yaml with your configuration"
    echo "3. Run: ./deploy.sh app  (to deploy the application after DNS is configured)"
    echo ""
    echo -e "${BLUE}💡 To deploy only the application (after infrastructure is ready):${NC}"
    echo "./deploy.sh app"
}

# Handle command line arguments
if [ "$1" = "app" ]; then
    deploy_application
else
    main
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
