@echo off
REM 🚀 StartupVerse Backend Deployment Script (Windows)
REM This script deploys your backend to Supabase in one command

echo.
echo ================================================== 
echo    StartupVerse Backend Deployment
echo ==================================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found!
    echo.
    echo 📥 Please install it first:
    echo    npm install -g supabase
    echo.
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Check if project is linked
echo 🔍 Checking Supabase connection...
supabase status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Not linked to a Supabase project
    echo.
    echo 🔗 Please link your project first:
    echo    supabase link
    echo.
    exit /b 1
)

echo ✅ Project linked
echo.

echo 📦 Deploying edge function...
echo.

REM Deploy the function
supabase functions deploy server

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================
    echo    DEPLOYMENT SUCCESSFUL!
    echo ==================================================
    echo.
    echo 🎉 Your backend is now LIVE!
    echo.
    echo 🧪 Test it with:
    echo    Run testBackendConnection^(^) in browser console
    echo.
    echo 📊 View logs:
    echo    supabase functions logs server
    echo.
    echo 📱 Your app will automatically detect the backend!
    echo    Reload your app to use Supabase mode.
    echo.
) else (
    echo.
    echo ==================================================
    echo    DEPLOYMENT FAILED
    echo ==================================================
    echo.
    echo 🆘 Troubleshooting:
    echo    1. Check you're logged in: supabase login
    echo    2. Verify project link: supabase status
    echo    3. View errors above for details
    echo.
    exit /b 1
)
