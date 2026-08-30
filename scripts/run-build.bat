@echo off
set PATH=C:\Program Files\nodejs;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\Git\cmd;%PATH%
cd /d E:\VIDEOCHATAPP\vibely
node --version
npm --version
docker --version
docker compose version
git --version
npm run build
