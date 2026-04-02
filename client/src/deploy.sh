#!/bin/bash

# 🚀 StartupVerse Backend Deployment Script
# This script deploys your backend to Supabase in one command

echo ""
echo "🚀 =================================================="
echo "   StartupVerse Backend Deployment"
echo "   =================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "📥 Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
echo "🔍 Checking Supabase connection..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Not linked to a Supabase project"
    echo ""
    echo "🔗 Please link your project first:"
    echo "   supabase link"
    echo ""
    exit 1
fi

echo "✅ Project linked"
echo ""

# Get project details
PROJECT_REF=$(supabase status | grep "API URL" | awk '{print $3}' | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo "📦 Deploying edge function..."
echo "   Project: $PROJECT_REF"
echo ""

# Deploy the function
supabase functions deploy server

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ =================================================="
    echo "   DEPLOYMENT SUCCESSFUL!"
    echo "   =================================================="
    echo ""
    echo "🎉 Your backend is now LIVE!"
    echo ""
    echo "🔗 API URL:"
    echo "   https://$PROJECT_REF.supabase.co/functions/v1/server"
    echo ""
    echo "🧪 Test it:"
    echo "   curl https://$PROJECT_REF.supabase.co/functions/v1/server/make-server-78157e08/health"
    echo ""
    echo "📊 View logs:"
    echo "   supabase functions logs server"
    echo ""
    echo "📱 Your app will automatically detect the backend!"
    echo "   Reload your app to use Supabase mode."
    echo ""
else
    echo ""
    echo "❌ =================================================="
    echo "   DEPLOYMENT FAILED"
    echo "   =================================================="
    echo ""
    echo "🆘 Troubleshooting:"
    echo "   1. Check you're logged in: supabase login"
    echo "   2. Verify project link: supabase status"
    echo "   3. View errors above for details"
    echo ""
    exit 1
fi
