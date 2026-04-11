@echo off
REM StartupVerse — deploy the Node/Express API (see /server in this repo).
REM Use your host's process manager (PM2, Docker, systemd) or your PaaS CLI.

echo.
echo Run the API from the server package, for example:
echo   cd ..\..\server
echo   npm install
echo   npm run start
echo.
echo Set VITE_API_URL in the client to match your deployed API base URL.
pause
