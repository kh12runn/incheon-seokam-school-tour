FROM node:22-alpine AS build
WORKDIR /app
COPY ["관리도구/웹서버.mjs", "관리도구/웹서버.mjs"]
COPY ["관리도구/배포최적화.mjs", "관리도구/배포최적화.mjs"]
COPY ["관리도구/관리자", "관리도구/관리자"]
COPY ["관리자", "관리자"]
COPY index.html ./
COPY ["웹학교", "웹학교"]
RUN node 관리도구/배포최적화.mjs /runtime
FROM node:22-alpine
RUN apk add --no-cache imagemagick imagemagick-heic imagemagick-jpeg imagemagick-webp \
    && apk add --no-cache --virtual .codec-check libheif-x265 \
    && magick -size 16x16 xc:white /tmp/school-codec-check.heic \
    && magick /tmp/school-codec-check.heic /tmp/school-codec-check.webp \
    && magick /tmp/school-codec-check.webp /tmp/school-codec-check.jpg \
    && rm /tmp/school-codec-check.heic /tmp/school-codec-check.webp /tmp/school-codec-check.jpg \
    && apk del .codec-check
WORKDIR /app
COPY --from=build /runtime/ ./
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "관리도구/웹서버.mjs"]
