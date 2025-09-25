#!/bin/bash
###
 # @Author: Zpekii 3156752796@qq.com
 # @Date: 2025-04-05 22:41:06
 # @LastEditors: Zpekii 3156752796@qq.com
 # @LastEditTime: 2025-09-12 07:30:29
 # @FilePath: /exam/deploy.sh
 # @Description: 
 # 
 # Copyright (c) 2025 by Zpekii, All Rights Reserved. 
### 

DATA_PATH=/var/data
BIN_PATH=/var/data/kApps

export GOROOT=$BIN_PATH/goLang
export GOPATH=$DATA_PATH/kUser/goUser
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=sum.golang.google.cn

export NODE_HOME=$BIN_PATH/node
export PNPM_HOME=/var/data/pnpm

mkdir -p $PNPM_HOME

APP_NAME=$1
if [ -z "$APP_NAME" ]; then
  APP_NAME=devmentor
fi

APP_VERSION=$2

DEPLOY_ROOT_PATH=/var/deploy/
DEPLOY_TARGET_PATH=/var/deploy/$APP_NAME/fe

echo "============== start build =============="
echo "           APP_NAME: $APP_NAME"
echo "        APP_VERSION: $APP_VERSION"
echo " DEPLOY_TARGET_PATH: $DEPLOY_TARGET_PATH"
echo "========================================="

export PATH="$GOPATH/bin:$GOROOT/bin:$NODE_HOME/bin:$PNPM_HOME:$BIN_PATH/bin:$BIN_PATH/docker:$PATH"

cat <<EOF > .npmrc
registry=https://registry.npmmirror.com/
@3min:registry=https://git.w2w.me:6443/api/v4/projects/19/packages/npm/
//git.w2w.me:6443/api/v4/projects/19/packages/npm/:_authToken=${NPM_AUTH_TOKEN}
EOF

echo "VITE_SERVER_PORT=6443" > .env.production

if [ -z "$(which pnpm)" ];then
  npm install -g pnpm
fi

npm install
npm run build

if ! test -e build; then
  echo can not find directory \'build\'
  ls -lha
  exit -1
fi

mkdir -p $DEPLOY_TARGET_PATH

echo "building completed, synchronizing to ${DEPLOY_TARGET_PATH}"
rsync -cruzEL ./build/ $DEPLOY_TARGET_PATH

echo "deployed to ${DEPLOY_TARGET_PATH}"