@echo off
REM StartupVerse Backend Deployment Script (Windows)
REM Deploys the Supabase Edge Function

echo ================================================
echo 🚀 StartupVerse Backend Deployment
echo ================================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found!
    echo.
    echo 📥 Installing Supabase CLI...
    call npm install -g supabase
    if %errorlevel% neq 0 (
        echo ❌ Installation failed!
        pause
        exit /b 1
    )
    echo ✅ Supabase CLI installed
    echo.
)

REM Show CLI version
echo 📦 Supabase CLI version:
call supabase --version
echo.

REM Check if logged in
echo 🔐 Checking authentication...
call supabase projects list >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Supabase
    echo 📝 Please log in...
    call supabase login
    if %errorlevel% neq 0 (
        echo ❌ Login failed!
        pause
        exit /b 1
    )
    echo ✅ Logged in successfully
) else (
    echo ✅ Already logged in
)
echo.

REM Project details
set PROJECT_REF=zuvrtclwxqycfskgtpbs
set FUNCTION_NAME=make-server-78157e08

echo 📋 Deployment Details:
echo    Project ID: %PROJECT_REF%
echo    Function: %FUNCTION_NAME%
echo.

REM Check if already linked
if exist ".supabase\config.toml" (
    echo ✅ Project already linked
) else (
    echo 🔗 Linking project...
    call supabase link --project-ref %PROJECT_REF%
    if %errorlevel% neq 0 (
        echo ❌ Project linking failed!
        pause
        exit /b 1
    )
    echo ✅ Project linked
)
echo.

REM Deploy function
echo 📤 Deploying Edge Function...
echo.
call supabase functions deploy %FUNCTION_NAME%
if %errorlevel% neq 0 (
    echo ❌ Deployment failed!
    echo.
    echo 🔍 Check the error above and try again.
    echo 📚 Docs: https://supabase.com/docs/guides/functions/deploy
    pause
    exit /b 1
)
echo.
echo ✅ Function deployed successfully!
echo.

REM Verify deployment
echo 🔍 Verifying deployment...
set HEALTH_URL=https://%PROJECT_REF%.supabase.co/functions/v1/%FUNCTION_NAME%/health
echo    Testing: %HEALTH_URL%
echo.

where curl >nul 2>nul
if %errorlevel% equ 0 (
    curl -s "%HEALTH_URL%"
    echo.
    echo.
    echo ✅ Health check complete
) else (
    echo ℹ️  curl not found, skipping health check
    echo    Manually verify: %HEALTH_URL%
)
echo.

REM Show logs command
echo ================================================
echo ✅ Deployment Complete!
echo ================================================
echo.
echo 📊 Next Steps:
echo    1. Refresh your app
echo    2. Check Backend Status indicator (should show 'Online')
echo    3. Test by assigning a task
echo.
echo 🔍 To view logs:
echo    supabase functions logs %FUNCTION_NAME% --follow
echo.
echo 📚 Dashboard:
echo    https://supabase.com/dashboard/project/%PROJECT_REF%/functions
echo.

pause
