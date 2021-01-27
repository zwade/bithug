FROM node:14

WORKDIR /problem

RUN apt update && apt upgrade -y && apt install -y git

ADD package.json yarn.lock server/package.json ./
RUN yarn install --frozen-lockfile

ADD . .
RUN yarn build

EXPOSE 1823

RUN git config --global user.email "bithug@bit.hug";
RUN git config --global user.name "Bithug";

CMD ["node", "server/dist/index.js"]