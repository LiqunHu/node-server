#!/bin/bash
docker kill $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker run --rm -p 0.0.0.0:33306:3306 --name mvndb -v $PWD/mysql/logs:/logs -v $PWD/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7
docker run --rm -p 127.0.0.1:16379:6379 --name mvnredis -d redis:4
docker run --rm -p 27017:27017 --name mvnmongo -v $PWD/mongodb:/data/db -d mongo:4
