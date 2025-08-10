# ThesisTrack AKS Deployment Guide

This guide will help you deploy ThesisTrack to Azure Kubernetes Service (AKS) with your domain `thesistrack.dev` and free SSL certificates.

## Prerequisites

### 1. Tools Required
- `kubectl` - Kubernetes command-line tool
- `helm` - Kubernetes package manager
- `az` - Azure CLI (for AKS management)

### 2. AKS Cluster
Make sure you have an AKS cluster running and `kubectl` is configured to connect to it:
```bash
# Connect to your AKS cluster
az aks get-credentials --resource-group <your-resource-group> --name <your-aks-cluster>

# Verify connection
kubectl get nodes
```

## Step 1: Configure DNS (CRITICAL FIRST STEP)

### Option A: Using name.com DNS Management
1. Log into your name.com account
2. Go to your domain `thesistrack.dev` DNS management
3. You'll need to add an A record after getting the LoadBalancer IP (see Step 3)

### Option B: Using Azure DNS (Recommended)
1. Create an Azure DNS zone for `thesistrack.dev`
2. Update your domain's nameservers at name.com to point to Azure DNS
3. This gives you better integration with Azure services

## Step 2: Configure Application Settings

Edit `k8s/thesistrack/values.yaml` and update the following values:

```yaml
# SSL Configuration - REQUIRED
ssl:
  email: your-actual-email@domain.com  # Used for Let's Encrypt notifications

# Secrets Configuration - REQUIRED
secrets:
  secretKey: "generate-a-secure-random-key-here"  # Use: openssl rand -base64 32
  googleClientId: "your-google-client-id.apps.googleusercontent.com"
  googleClientSecret: "your-google-client-secret"

# Email Configuration - OPTIONAL
email:
  smtpHost: "smtp.gmail.com"  # If using Gmail
  smtpPort: "587"
  smtpUser: "your-email@gmail.com"
  smtpPassword: "your-app-password"  # Gmail app password
  fromEmail: "your-email@gmail.com"
  fromName: "ThesisTrack"
```

### Generate a Secure Secret Key
```bash
openssl rand -base64 32
```

## Step 3: Deploy Infrastructure

Run the deployment script to set up the infrastructure:

```bash
cd k8s
./deploy.sh
```

This will:
1. Install NGINX Ingress Controller
2. Install cert-manager for SSL certificates
3. Display the LoadBalancer IP address

**Important**: Note the LoadBalancer IP address that's displayed!

## Step 4: Configure DNS Record

Using the LoadBalancer IP from Step 3:

### name.com DNS Configuration:
1. Log into name.com
2. Go to DNS management for `thesistrack.dev`
3. Add an A record:
   - **Host**: `@` (or leave blank)
   - **Answer**: `<LoadBalancer-IP-from-step-3>`
   - **TTL**: 300 (5 minutes)

### Verify DNS Propagation:
```bash
# Check if DNS is working
nslookup thesistrack.dev
# or
dig thesistrack.dev
```

Wait for DNS propagation (usually 5-15 minutes).

## Step 5: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - Add: `https://thesistrack.dev`
4. Update **Authorized redirect URIs**:
   - Add: `https://thesistrack.dev`

## Step 6: Deploy Application

Once DNS is configured and propagating:

```bash
cd k8s
./deploy.sh app
```

This will deploy the ThesisTrack application with all components.

## Step 7: Verify Deployment

### Check Pod Status:
```bash
kubectl get pods -n thesistrack
```

### Check Ingress and SSL:
```bash
kubectl get ingress -n thesistrack
kubectl get certificate -n thesistrack
```

### Check SSL Certificate Status:
```bash
kubectl describe certificate thesistrack-tls -n thesistrack
```

The certificate should show `Ready: True` once issued.

## Step 8: Test the Application

1. **Frontend**: Visit `https://thesistrack.dev`
2. **Backend API**: Visit `https://thesistrack.dev/docs`
3. **Test Google OAuth**: Try signing in with Google

## Troubleshooting

### DNS Issues
```bash
# Check if domain resolves to LoadBalancer IP
nslookup thesistrack.dev

# Check ingress status
kubectl describe ingress thesistrack-ingress -n thesistrack
```

### SSL Certificate Issues
```bash
# Check certificate status
kubectl get certificate -n thesistrack
kubectl describe certificate thesistrack-tls -n thesistrack

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager
```

### Application Issues
```bash
# Check pod logs
kubectl logs -n thesistrack deployment/frontend
kubectl logs -n thesistrack deployment/backend
kubectl logs -n thesistrack deployment/postgres

# Check pod status
kubectl get pods -n thesistrack
kubectl describe pod <pod-name> -n thesistrack
```

### Google OAuth Issues
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the secrets
2. Check that authorized origins include `https://thesistrack.dev`
3. Ensure the domain is accessible via HTTPS

## Monitoring and Maintenance

### View Application Logs:
```bash
# Backend logs
kubectl logs -f -n thesistrack deployment/backend

# Frontend logs  
kubectl logs -f -n thesistrack deployment/frontend
```

### Update Application:
```bash
# After pushing new images to your container registry
helm upgrade thesistrack ./thesistrack -n thesistrack
```

### Scale Application:
```bash
# Scale frontend replicas
kubectl scale deployment frontend --replicas=3 -n thesistrack

# Scale backend replicas
kubectl scale deployment backend --replicas=2 -n thesistrack
```

## Security Notes

1. **Secrets Management**: All sensitive data is stored in Kubernetes secrets
2. **SSL/TLS**: Automatic HTTPS redirection is enabled
3. **CORS**: Configured for your domain
4. **Database**: PostgreSQL is only accessible within the cluster

## Cost Optimization

- **Resources**: Adjust CPU/memory requests and limits in deployment files
- **Storage**: Monitor PostgreSQL storage usage
- **LoadBalancer**: Consider using Azure Application Gateway for advanced features

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Kubernetes events: `kubectl get events -n thesistrack`
3. Check Azure AKS diagnostics in the Azure portal

---

🎉 **Congratulations!** Your ThesisTrack application should now be running securely at `https://thesistrack.dev`!
