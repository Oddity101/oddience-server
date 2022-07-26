FROM node:16.16-alpine AS development
RUN apk add g++ make py3-pip
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=5000
ENV NODE_ENV=development
EXPOSE 5000
CMD [ "yarn", "dev" ]

FROM node:16.16-alpine AS production
RUN apk add g++ make py3-pip
ENV NODE_ENV=production
WORKDIR /app
COPY . .
COPY .env /app/config/config.env
RUN yarn install --frozen-lockfile
ENV HOST=0.0.0.0
ENV PORT=5000

USER node
EXPOSE 5000
CMD [ "yarn", "start" ]