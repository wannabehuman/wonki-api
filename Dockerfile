# Base 이미지 설정 (Node.js 기반)
FROM node:20 AS base

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

COPY tsconfig*.json ./

# 의존성 설치
RUN npm install && \
    npm install @nestjs/typeorm typeorm pg && \
    npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt && \
    npm install -D @types/bcrypt @types/passport-jwt && \
    npm install class-validator class-transformer && \
    npm install @nestjs/mapped-types
    
# 개발 단계 설정
FROM base AS development

# 환경 변수 설정
ENV NODE_ENV=development

# NestJS CLI 설치 (개발 도구)
RUN npm install --save-dev @nestjs/cli

# 애플리케이션 소스 복사
COPY . .

# 빌드 실행
RUN npm run build

# 개발 서버 포트 노출
EXPOSE 3000

# 애플리케이션 실행 (개발 모드)
CMD ["npm", "run", "start:dev"]