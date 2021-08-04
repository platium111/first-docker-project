
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
  `docker logs myContainerForFirstApp`

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

[COMMANDS]
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
[REFERENCE]
* bash 
  https://tldp.org/LDP/Bash-Beginners-Guide/html/index.html