#!/bin/bash

# ThesisTrack Environment Sync Script
set -e

echo "🔄 ThesisTrack Environment Sync"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# File paths
ENV_FILE="../.env"
VALUES_FILE="thesistrack/values.yaml"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found at $ENV_FILE${NC}"
    echo -e "${YELLOW}Creating a template .env file...${NC}"
    
    cat > "$ENV_FILE" << 'EOF'
# Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=thesistrack

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=ThesisTrack

# Environment
ENVIRONMENT=development

# Frontend Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
EOF
    
    echo -e "${GREEN}✅ Created template .env file at $ENV_FILE${NC}"
    echo -e "${YELLOW}Please edit the .env file with your actual values, then run this script again.${NC}"
    exit 1
fi

# Check if values.yaml exists
if [ ! -f "$VALUES_FILE" ]; then
    echo -e "${RED}❌ values.yaml not found at $VALUES_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📖 Reading values from .env file...${NC}"

# Function to get value from .env file
get_env_value() {
    local key="$1"
    local value=$(grep "^${key}=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    echo "$value"
}

# Function to update values.yaml
update_values() {
    local key="$1"
    local value="$2"
    local section="$3"
    
    if [ ! -z "$value" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|${key}: .*|${key}: \"${value}\"|g" "$VALUES_FILE"
        else
            # Linux
            sed -i "s|${key}: .*|${key}: \"${value}\"|g" "$VALUES_FILE"
        fi
        echo -e "${GREEN}✅ Updated ${section}.${key}${NC}"
    else
        echo -e "${YELLOW}⚠️  ${section}.${key} not found in .env file${NC}"
    fi
}

# Get values from .env file
SECRET_KEY=$(get_env_value "SECRET_KEY")
GOOGLE_CLIENT_ID=$(get_env_value "GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET=$(get_env_value "GOOGLE_CLIENT_SECRET")
SMTP_HOST=$(get_env_value "SMTP_HOST")
SMTP_PORT=$(get_env_value "SMTP_PORT")
SMTP_USER=$(get_env_value "SMTP_USER")
SMTP_PASSWORD=$(get_env_value "SMTP_PASSWORD")
EMAILS_FROM_EMAIL=$(get_env_value "EMAILS_FROM_EMAIL")
EMAILS_FROM_NAME=$(get_env_value "EMAILS_FROM_NAME")

echo -e "${BLUE}🔄 Updating Kubernetes values.yaml...${NC}"

# Update secrets section
update_values "secretKey" "$SECRET_KEY" "secrets"
update_values "googleClientId" "$GOOGLE_CLIENT_ID" "secrets"
update_values "googleClientSecret" "$GOOGLE_CLIENT_SECRET" "secrets"

# Update email section
update_values "smtpHost" "$SMTP_HOST" "email"
update_values "smtpPort" "$SMTP_PORT" "email"
update_values "smtpUser" "$SMTP_USER" "email"
update_values "smtpPassword" "$SMTP_PASSWORD" "email"
update_values "fromEmail" "$EMAILS_FROM_EMAIL" "email"
update_values "fromName" "$EMAILS_FROM_NAME" "email"

echo ""
echo -e "${BLUE}📧 SSL Email Configuration${NC}"
echo "For SSL certificates, you need to set your email address."
echo "This should be your Azure account email (the one you use to log into Azure portal)."
echo ""

# Get current SSL email
current_ssl_email=$(grep "email:" "$VALUES_FILE" | head -1 | sed 's/.*email: *//g' | tr -d '"')

if [ "$current_ssl_email" = "your-email@example.com" ] || [ -z "$current_ssl_email" ]; then
    echo -e "${YELLOW}Enter your Azure email address for SSL certificates:${NC}"
    read -r azure_email
    
    if [ ! -z "$azure_email" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|email: .*|email: \"${azure_email}\"|g" "$VALUES_FILE"
        else
            sed -i "s|email: .*|email: \"${azure_email}\"|g" "$VALUES_FILE"
        fi
        echo -e "${GREEN}✅ Updated SSL email to: ${azure_email}${NC}"
    fi
else
    echo -e "${GREEN}✅ SSL email already configured: ${current_ssl_email}${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Environment sync completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "✅ Secrets synced from .env file"
echo "✅ Email configuration synced from .env file"
echo "✅ SSL email configured for Let's Encrypt"
echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo "1. Review the updated values.yaml file"
echo "2. Run: ./deploy.sh (to deploy infrastructure)"
echo "3. Configure DNS and Google OAuth settings"
echo "4. Run: ./deploy.sh app (to deploy application)"
