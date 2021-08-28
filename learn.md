
```
FROM node:15
WORKDIR /app
COPY package.json . // . is refer to app because already set in WORKDIR
RUN npm install
COPY . ./
EXPOSE 3000
CMD [ "node", "index.js" ]

```

* why only copy json 
  because it takes every step as a layer, so separate concern 
    -> if fail at one will not run later -> optimizer
    -> if we not change in COPY package.json -> it's cache -> not need to run again. If we change, it will install
* can use `.` or `./` or `/app`

```
docker build .
docker image ls
docker image rm 5d1184c03742
docker build -t first-app . // create image
docker run -d --name myContainerForFirstApp first-app // first one is container name
docker rm myContainerForFirstApp -f // remove container (using force to kill running container)
docker run -p 4000:3000 -d --name myContainerForFirstApp first-app // 1st port is from browser, 2nd port is from container
docker exec -it myContainerForFirstApp bash // go to file system of container -> can typing `ls` to see and `exit` to exit
docker volume
docker volume prune // removed unrunning
docker rm myContainerForFirstApp -fv // remove container including volume
```

* I tried to change package.json , here is the result -> will not display cache in step 3/7 (!only for docker build)
Step 2/7 : WORKDIR /app
 ---> Using cache
 ---> 2567bdf14ae7
Step 3/7 : COPY package.json .
 ---> 8b44397cb64b

* always use -t to set name for image

* should not copy all (ex node_modules, Dockerfile) -> because some secret files and waste of time
  -> create `.dockerignore` file
  * although it has node_modules in container but now it's not copy, it is because running `npm install` inside container

* [pr] everytime we change the code -> need to rebuild and run again
  * [sol] using volume and syn local code to container
    `docker run -p 4000:3000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-docker-project\':/app --name myContainerForFirstApp first-app`
    `docker run -p 4000:3000 -d -v %cd%:/app --name myContainerForFirstApp first-app` // windows shell,
    `docker run -p 4000:3000 -d -v ${pwd}:/app --name myContainerForFirstApp first-app` //  `${pwd}` for power shell -> not working in my machine
    * need full path for the first one, `.` is not working
  * still not working when we change the file -> because whenever you change the code, need to run `node index.js` again -> using nodemon for now

* devDependencies 
  -> use npm i --save-dev, it will not install in production (example use for nodemon)

* to see docker log (what print out when run `npm run dev`)
  `docker logs myContainerForFirstApp -f`

* [pr] if we remove `node_modules`, cannot run localhost:40000
  -> because we syn our local files to container by using `-v` (called bind mount) -> we should prevent (can't delete) it by using another volume
  `docker run -p 4000:3000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-docker-project\':/app -v /app/node_modules --name myContainerForFirstApp first-app`
  * bind mount just uses for development -> still need to use COPY inside Dockerfile

* [security] because we use -v to syn, so when container created file, it can syn to your local system
  -> make readonly bind mount by using `:ro` concat after -v
  `docker run -p 4000:3000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-docker-project\':/app:ro -v /app/node_modules --name myContainerForFirstApp first-app`

* ENVIROMENT
  * need to set ENV and EXPOSE in Dockerfile and command with -p and --env PORT to pass port number in
    `docker run -p 4000:4000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-docker-project\':/app:ro -v /app/node_modules --env PORT=4000 --name myContainerForFirstApp first-app`
  * if want to pass more env, use more --env each -> but the best case is using the file to save env `--env-file ./.env`
    `docker run -p 4000:4000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-docker-project\':/app:ro -v /app/node_modules --env-file ./.env --name myContainerForFirstApp first-app`

* delete volume
  each time when we use `-v`, will create volume, even when we remove it, it's still preserved

* [pr] there are so many container in full app, problem is needed to run so many commands
  -> [sol] using docker-compose.yml

* Docker compose
  * `docker-compose up -d`
    -> after this we have `docker image ls` = first-docker-project_node-app
    -> `docker ps` = first-docker-project_node-app_1
  * `docker-compose down -v` can remove container and volume
    * when run `up` again, it's very fast because it's based on docker image already there
      * but it's not smart if we change something else -> need to run `build` again `docker-compose up -d --build` to force build

* Change package.json or Dockerfile not automatic build in both docker-compose and docker build -> need to run `compose --build` or `docker build` again


[pr] bind mount is not good in production because we don't want it or using different port, not use nodemon ...
  [sol] separate Dockerfile in dev and prod env and common Docker such as `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`
  * run 3 files
    dev `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
    prod `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
      -> in prod it's not bulding again -> everytime code change need to pass `--build` in there
        `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
  * down container
    `docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v` 
  * remember need to add 3 files in .dockerignore

[pr] nodemon is still installed in production mode
  [sol] in Dockerfile change `RUN npm install --only=production` and has `IF` in Dockerfile
  * `RUN if [ "$NODE_ENV" = "development" ];` spacing is matter in the end of []


PART 2: MONGO
* Add mongo, use `image:mongo`  instead of `build`, then passing environment....
* `docker exec -it first-docker-project_mongo_1 bash` -> `mongo -u "hieptq" -p "mypassword"`
  * quick way `docker exec -it first-docker-project_mongo_1 mongo -u "hieptq" -p "mypassword"` 
* need to insert into db, then `show dbs` can work

* [pb] if we remove container, then start again, `mydb` will be gone
  * [sol] using `volumes` by declare inside `volumes` in the same level as `services` and map to volumes inside mongo

* notes: when we using `down`, we should not use `-v` in this case because it'll remove the volume we have for mongo
* `docker inspect first-docker-project_node-app_1` -> to see network and other info
  * `first-docker-project_default` is the default network

* Network
  * container only talks to other containers in the same network, can't talk to other network
  * [pr] Normally, need to have specfic IP to point to mongoGB, but can have DNS for network which is easy to connect containers
    * [sol] `mongoose.connect("mongodb://hieptq:mypassword@mongo/?authSource=admin")` // using mongo instead of IP
    * can check by go to bash of nodejs, then `ping mongo`
    * this is not working with default bridge network, but can work with your default bridge network
  * `docker network inspect first-docker-project_default` -> inpect your default network bridge
    * we can see all info of network for nodejs and mongo container

* `depends_on` start services inside depends on first before start itself
  * still need Nodejs code handles this error, example: retry connection for mongo. Don't rely on orchestration

* `--no-deps` only run specific service without care about `depends_on`. Normally, if we just specify service after .yml, we can start only that service.
  * `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --no-deps mongo`
[COMMANDS]


PART 3 : Route in Nodejs
using intereactive logs `docker logs first-docker-project_node-app_1 -f` with -f
* normal file system
  touch myfile // use in linux
  printenv // print environment
  ls -l // sort file by alphabet
* mongo
  db
  use mydb // swtich to mydb
  show dbs // show all db
  db.books.insert({"name": "game of thrones"})
  db.books.find()

* redis
  * Aadd new redis image into .yml -> just need to use `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d` instead of using `down` and `up` again because docker-compose is smart enough. However, if we add new libs by using `npm install` we need to `down and up `again

  * [pr] when we install redis and express-session, we need to `down and up or using up only`, it will refer to old anonymous volume which doesn't have data for redis and express-session -> so need to force it to use the new one by `-V` in docker command

* [pr] Connection ECONNREFUSED 127.0.0.1:6379 when running node
  * [sol] problem could be not connected to the right `redis-server` -> need to have url inside redis client when we use `createClient`
    ```javascript
      let redisClient = redis.createClient({
      host: REDIS_URL,
      port: REDIS_PORT,
      url: "redis://redis:6379", // refer to Redis server
      });
    ```

* Cookie
  * we save cookie inside session stored in our database, `docker exec -it first-docker-project_redis_1 bash` -> `redis-cli` to see cli to manage database
  * `KEYS *` used to show all keys
  * `GET "sess:8jpbom-OjyWPgDYRPjvi3E79J--uB86c"` to get details 

* Session
  * when we login -> need to have cookies info into session by app.use(session(...)). Each user will have separated session. After that, when we create a post, we need middleware to check if it has `user` inside `req.session`, if not we stop it, otherwise we go to the next().

  * session has config for expired time, so when time up, session is removed from Redis

* Load balancing NGINX
  * normal, we can create multiple containers, map multiple client ports to 2 container (example). EX : 3001:3000, 3000:3000 -> it's the issue, so many port mappings -> we need something automatically -> USing NGINX
    * 3000 in client -> map to 80 (nginx) -> auto map with 2 containers in port 3000
	* remember to config NGINX with `default_conf` and redirect proxy, path
	* make config in docker-compose include dev and prod
  * `--scale node=app=3` -> need to change the port from 3000 to 4000 in Dockerfile in mapping from outside. Otherwise get error in using port 3000

  * [how to test load balancing]
    * after using scale, we have 3 containers -> using `docker logs ...` for 3 container, then make a request, we can see it's dipslayed one at a time
      [pr] Got error in not doing load balancing. It's because I lack `;` in some commands in `default.conf` file

* CORS
  * With 2 different domains, frontend cannot access backend -> need to config CORS
  * WHen install new library -> need to run `--build` again and `-v` for recreating anonymous volume because we use it from `node_modules`

* DigitalOcean
  * Create droplet
  * got to powershell `ssh root@[ip_address]` -> put password in
  * Install Docker in Ubuntu
    * go to `get.docker.com` -> curl -fsSL https://get.docker.com -o get-docker.sh
    * `ls` to see the file there, actually the link above has all script automatically run
    * wait -> verify `docker --version`
    * Need to install `docker-compose` -> go to the homepage -> Linux, see the command
      * Use 2 commands from docker-compose homepage
  * Change the environment variable in .yml production file to use ${ENV VARIABLE}
  * using `export SESSION_SECRET="hello"` in SSH -> but very slow -> create the file is better
    * using `printenv` to check environment there
    * `vi .env` to create file -> fill up all env from .yml
    * write few script inside `.profile` to get all env above
    * Exit all ssh to see env again in printenv
  * create `mkdir app` -> `cd app` -> `git clone [url] .`
  * run `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
  * using IP from DigitalOcean to test
  * WHEN CODE CHANGE
    * [pr] need to push and pull in D.O -> docker-compose ... down -> docker-compose... up. BUT it's not updating the code because this is PROD env, we don't sync our code
      -> [sol] using `--build` to force rebuild image
      -> NOTE here, we don't change Redis, Mongo, so just rebuild specific service which is `node-app` -> command `--build node-app --no-deps`. It will reduce error prones if we have typo in Mongo or Redis.
        * `--no-deps` here is used because node-app depends on Mongo in /.yml file, so it's will not check Mongo if we use this command
        -> `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build node-app --no-deps`
  * If want to recreate container by some reason, just use `--force-recreate node-app`
  * [pr] we have problems with git push, git pull and using docker-compose with build images, because it consumes memory, processing... -> NEVER BUILD IN PROD, JUST HANDLE PRODUCTION TRAFFIC
    ->[sol] Build image on dev server -> push to DockerHub (Amazon repo) -> in prod server just pull image and run `docker-compose ... up`
  * DOCKER HUB
    * create a repo name `node-app`
    * using `docker image ls` to see the name of image we need to push
    * `docker login`
    * [pr] to push in dockerhub, we need unique repo such as `hieptqsocial/node-app` (has username)
      * [sol] `docker image tag first-docker-project_node-app hieptqsocial/node-app`
    * `docker push hieptqsocial/node-app`
    * change in docker-compose.yml which has node-app with  image: hieptqsocial/node-app
      * Just checking if PROD can build it from dockerhub, this is just a testing purpose
        * git push -> in SSH, using git pull -> build again will see `Sending build context to Docker daemon  341.5kB` mean that it's pulling image from dockerhub
          * also check it `Successfully tagged hieptqsocial/node-app:latest`
    * We need to build prod env in our local
      1) using `docker-compose -f docker-compose.yml -f docker-compose.prod.yml build` to build image -> we can see update in hieptqsocial/node-app
        * if we just need `node-app`, just pass it in
      2) push `docker-compose -f docker-compose.yml -f docker-compose.prod.yml push`
        * the same can put `node-app` there
    * PULL from ssh
      * `docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull`
    * RUN
      * `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
      * we can use `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps node-app`
  * [improvement] Current flow we need to do manually build prod in local and push image to dockerhub -> in dockerpub we need to `docker pull` and `up` -> we can use docker watchpower to automatically identify changes in image then auto pull and up in SSH
    1) in SSH, `docker run -d --name watchtower -e WATCHTOWER_TRACE=true -e WATCHTOWER_DEBUG=true -e WATCHTOWER_POLL_INTERVAL=50 -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower app_node-app_1` 
      * can use `docker logs watchtower -f` to see log (check the name in `docker ps`)
      * if wrong in watchtower, can use `docker rm watchtower -f` to remove the container
  * [improvement] ROLLING UPDATE: currenly we need to tear down the container and using new container for every changes we have, it will be the reduction in the traffic -> rolling update with Container Orchestration with Kubernetes/Dockerswarm can solve it
    * docker-compose is very simple tool just to run, build... containers -> Dockerswarm can manage multiple containers which can create multiple containers (distributed services). rolling update
    * It has multiple `Manager Node` and `Worker Node` which can use many services to deploy apps. Manager node pushes tasks to Worker Node
    * STEPS
      1) can use `docker info` to check if it has Dockerswarm enable 
      2) default is inable, check ip network first `ip add` -> can see eth0 with public IP
      3) create docker swarm `docker swarm init --advertise-addr 174.138.25.214` -> it will create `Manager Node`
        * we can add Workder node to Manager Node using commands when run command above
      4) 



[REFERENCE]
* bash 
  https://tldp.org/LDP/Bash-Beginners-Guide/html/index.html

[COMMAND]
* kill port 
  * `npx kill-port 4000`
* current folder in Linux -> `pwd`
* create new file `vi .env` -> create .env file
  * `Shift + right click` to paste text into vi
  * `ECS` to finish editing -> `:wq` to save and quit, `:qa` to exit
  * `ls -la` to print all files

