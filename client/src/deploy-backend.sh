#!/bin/bash

# StartupVerse Backend Deployment Script
# Deploys the Supabase Edge Function

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 StartupVerse Backend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
    echo ""
fi

# Show CLI version
echo "📦 Supabase CLI version:"
supabase --version
echo ""

# Check if logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "📝 Please log in..."
    supabase login
    echo "✅ Logged in successfully"
else
    echo "✅ Already logged in"
fi
echo ""

# Project details
PROJECT_REF="zuvrtclwxqycfskgtpbs"
FUNCTION_NAME="make-server-78157e08"

echo "📋 Deployment Details:"
echo "   Project ID: $PROJECT_REF"
echo "   Function: $FUNCTION_NAME"
echo ""

# Check if already linked
if [ -f "./.supabase/config.toml" ]; then
    echo "✅ Project already linked"
else
    echo "🔗 Linking project..."
    supabase link --project-ref $PROJECT_REF
    echo "✅ Project linked"
fi
echo ""

# Deploy function
echo "📤 Deploying Edge Function..."
echo ""
supabase functions deploy $FUNCTION_NAME
echo ""
echo "✅ Function deployed successfully!"
echo ""

# Verify deployment
echo "🔍 Verifying deployment..."
HEALTH_URL="https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/health"
echo "   Testing: $HEALTH_URL"
echo ""

if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s "$HEALTH_URL" || echo "FAILED")
    if [[ $RESPONSE == *"ok"* ]]; then
        echo "✅ Health check PASSED"
        echo "   Response: $RESPONSE"
    else
        echo "⚠️  Health check failed"
        echo "   Response: $RESPONSE"
        echo ""
        echo "   The function is deployed but may still be starting up."
        echo "   Wait 30 seconds and check the app's Backend Status indicator."
    fi
else
    echo "ℹ️  curl not found, skipping health check"
    echo "   Manually verify: $HEALTH_URL"
fi
echo ""

# Show logs command
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next Steps:"
echo "   1. Refresh your app"
echo "   2. Check Backend Status indicator (should show 'Online')"
echo "   3. Test by assigning a task"
echo ""
echo "🔍 To view logs:"
echo "   supabase functions logs $FUNCTION_NAME --follow"
echo ""
echo "📚 Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo ""
