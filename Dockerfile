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
WORKDIR /app
COPY --from=build /runtime/ ./
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "관리도구/웹서버.mjs"]
