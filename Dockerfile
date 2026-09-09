FROM node:22-alpine
WORKDIR /app
COPY ["관리도구/웹서버.mjs", "관리도구/웹서버.mjs"]
COPY index.html ./
COPY ["웹학교", "웹학교"]
COPY ["사진보관/웹용/4층", "사진보관/웹용/4층"]
COPY ["결과물/미리보기", "결과물/미리보기"]
COPY ["모델/school_master.blend", "모델/school_master.blend"]
COPY ["공간자료/촬영폴더_목록.csv", "공간자료/촬영폴더_목록.csv"]
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "관리도구/웹서버.mjs"]
