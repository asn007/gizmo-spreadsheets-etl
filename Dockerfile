FROM node:lts-alpine as deps
WORKDIR /opt/app

COPY package.json yarn.lock ./
RUN yarn

FROM deps as builder
WORKDIR /opt/app
COPY src src
COPY tsconfig.json .
RUN yarn build

FROM node:lts-alpine as app
WORKDIR /opt/app
COPY --from=deps /opt/app/package.json .
COPY --from=deps /opt/app/node_modules node_modules
COPY --from=builder /opt/app/dist dist
CMD [ "yarn", "start" ]
