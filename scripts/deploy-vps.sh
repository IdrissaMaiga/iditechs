#!/usr/bin/env bash
# Deploy the working tree to VPS2 (projexel-vps2): upload source, rebuild the image,
# restart the container, smoke-test. Env lives only on the server: /opt/iditechs-web/.env
set -euo pipefail
HOST="${DEPLOY_HOST:-projexel-vps2}"
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "packing source..."
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.vercel --exclude='.env*' \
    --exclude=mcp-server --exclude='Certificat_IDITECHS.*' --exclude=tsconfig.tsbuildinfo \
    -czf "$TMP/src.tgz" .
scp -q "$TMP/src.tgz" "$HOST:/opt/iditechs-web/src.tgz"

ssh "$HOST" 'set -e
cd /opt/iditechs-web
rm -rf src.new && mkdir src.new && tar -xzf src.tgz -C src.new 2>/dev/null
docker tag iditechs-web:latest iditechs-web:previous 2>/dev/null || true
echo "building image (about 3 minutes)..."
docker build --memory=3g -t iditechs-web:latest src.new > build.log 2>&1 || { tail -40 build.log; exit 1; }
rm -rf src && mv src.new src
docker rm -f iditechs_web >/dev/null 2>&1 || true
mkdir -p /opt/iditechs-web/geo
docker run -d --name iditechs_web --restart unless-stopped --network host \
  --env-file /opt/iditechs-web/.env -v /opt/iditechs-web/geo:/geo:ro --memory 1g iditechs-web:latest >/dev/null
for i in $(seq 1 30); do curl -sf -o /dev/null -H "Host: idrissamaiga.iditechs.com" http://127.0.0.1:3420/ && break; sleep 1; done
for h in idrissamaiga.iditechs.com iditechs.com; do
  printf "%s / -> " "$h"; curl -s -o /dev/null -w "%{http_code}\n" -H "Host: $h" http://127.0.0.1:3420/
done
docker image prune -f >/dev/null'
echo "deployed. rollback: ssh $HOST 'docker rm -f iditechs_web && docker run -d --name iditechs_web --restart unless-stopped --network host --env-file /opt/iditechs-web/.env -v /opt/iditechs-web/geo:/geo:ro --memory 1g iditechs-web:previous'"
