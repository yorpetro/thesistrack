#!/bin/bash

# ThesisTrack Configuration Script
set -e

echo "🔧 ThesisTrack Configuration Helper"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VALUES_FILE="thesistrack/values.yaml"

echo -e "${BLUE}This script will help you configure ThesisTrack for deployment.${NC}"
echo ""

# Check if values.yaml exists
if [ ! -f "$VALUES_FILE" ]; then
    echo -e "${RED}❌ values.yaml not found at $VALUES_FILE${NC}"
    exit 1
fi

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local variable="$2"
    local current_value="$3"
    local is_secret="$4"
    
    if [ "$is_secret" = "true" ]; then
        echo -e "${YELLOW}$prompt${NC}"
        echo "Current: [HIDDEN]"
        echo -n "Enter new value (or press Enter to keep current): "
        read -s new_value
        echo ""
    else
        echo -e "${YELLOW}$prompt${NC}"
        echo "Current: $current_value"
        echo -n "Enter new value (or press Enter to keep current): "
        read new_value
    fi
    
    if [ ! -z "$new_value" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$variable: .*|$variable: \"$new_value\"|g" "$VALUES_FILE"
        else
            # Linux
            sed -i "s|$variable: .*|$variable: \"$new_value\"|g" "$VALUES_FILE"
        fi
        echo -e "${GREEN}✅ Updated $variable${NC}"
    else
        echo -e "${BLUE}ℹ️  Kept current value for $variable${NC}"
    fi
    echo ""
}

echo -e "${BLUE}📧 SSL Configuration${NC}"
echo "Let's Encrypt needs your email for certificate notifications."
current_email=$(grep "email:" "$VALUES_FILE" | head -1 | sed 's/.*email: *//g' | tr -d '"')
prompt_input "Enter your email address for SSL certificates:" "email" "$current_email" "false"

echo -e "${BLUE}🔐 Security Configuration${NC}"
echo "Generate a secure secret key for JWT tokens."
current_secret=$(grep "secretKey:" "$VALUES_FILE" | sed 's/.*secretKey: *//g' | tr -d '"')

echo -e "${YELLOW}Generate a new secure secret key? (y/n)${NC}"
read -n 1 generate_key
echo ""

if [ "$generate_key" = "y" ] || [ "$generate_key" = "Y" ]; then
    if command -v openssl &> /dev/null; then
        new_secret=$(openssl rand -base64 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|secretKey: .*|secretKey: \"$new_secret\"|g" "$VALUES_FILE"
        else
            sed -i "s|secretKey: .*|secretKey: \"$new_secret\"|g" "$VALUES_FILE"
        fi
        echo -e "${GREEN}✅ Generated new secret key${NC}"
    else
        echo -e "${RED}❌ openssl not found. Please install openssl or manually set the secret key.${NC}"
        prompt_input "Enter a secure secret key (32+ characters):" "secretKey" "$current_secret" "true"
    fi
else
    prompt_input "Enter a secure secret key (32+ characters):" "secretKey" "$current_secret" "true"
fi

echo -e "${BLUE}🔑 Google OAuth Configuration${NC}"
echo "Configure Google OAuth for user authentication."
current_client_id=$(grep "googleClientId:" "$VALUES_FILE" | sed 's/.*googleClientId: *//g' | tr -d '"')
current_client_secret=$(grep "googleClientSecret:" "$VALUES_FILE" | sed 's/.*googleClientSecret: *//g' | tr -d '"')

prompt_input "Enter your Google OAuth Client ID:" "googleClientId" "$current_client_id" "false"
prompt_input "Enter your Google OAuth Client Secret:" "googleClientSecret" "$current_client_secret" "true"

echo -e "${BLUE}📧 Email Configuration (Optional)${NC}"
echo "Configure SMTP for email notifications (optional)."
echo -e "${YELLOW}Do you want to configure email? (y/n)${NC}"
read -n 1 configure_email
echo ""

if [ "$configure_email" = "y" ] || [ "$configure_email" = "Y" ]; then
    current_smtp_host=$(grep "smtpHost:" "$VALUES_FILE" | sed 's/.*smtpHost: *//g' | tr -d '"')
    current_smtp_user=$(grep "smtpUser:" "$VALUES_FILE" | sed 's/.*smtpUser: *//g' | tr -d '"')
    current_from_email=$(grep "fromEmail:" "$VALUES_FILE" | sed 's/.*fromEmail: *//g' | tr -d '"')
    
    prompt_input "Enter SMTP host (e.g., smtp.gmail.com):" "smtpHost" "$current_smtp_host" "false"
    prompt_input "Enter SMTP username/email:" "smtpUser" "$current_smtp_user" "false"
    prompt_input "Enter SMTP password:" "smtpPassword" "[HIDDEN]" "true"
    prompt_input "Enter 'from' email address:" "fromEmail" "$current_from_email" "false"
fi

echo -e "${GREEN}🎉 Configuration completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review your configuration in $VALUES_FILE"
echo "2. Make sure your DNS is configured to point thesistrack.dev to your LoadBalancer IP"
echo "3. Update Google OAuth settings to include https://thesistrack.dev"
echo "4. Run: ./deploy.sh app"
echo ""
echo -e "${BLUE}💡 Configuration file location: $VALUES_FILE${NC}"
