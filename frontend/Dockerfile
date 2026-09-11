# Kor Travel Concierge 프론트엔드 이미지 (초안)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
# vendor/의 file: tarball(vworld-map-core/web)은 npm ci가 참조하므로 소스 COPY보다
# 먼저 있어야 한다. package.json/package-lock.json/vendor가 바뀔 때만 이 레이어가
# 무효화되므로 캐싱 이점은 유지된다.
COPY vendor ./vendor
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
