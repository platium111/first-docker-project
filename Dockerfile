FROM node:15
WORKDIR /app
COPY package.json .

ARG NODE_ENV="development"
RUN echo "check node env === ${NODE_ENV}"
RUN if [ "$NODE_ENV" = "development" ]; \
  then npm install; \
  else npm install --only=prod; \
  fi

COPY . ./
ENV PORT 3000
EXPOSE $PORT
CMD [ "node", "index.js" ]