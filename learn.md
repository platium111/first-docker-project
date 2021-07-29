
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
docker images ls
docker image rm 5d1184c03742
docker build -t first-app . // create image
docker run -d --name myContainerForFirstApp first-app // first one is container name
docker rm myContainerForFirstApp -f // remove container (using force to kill running container)
docker run -p 4000:3000 -d --name myContainerForFirstApp first-app // 1st port is from browser, 2nd port is from container
docker exec -it myContainerForFirstApp bash // go to file system of container -> can typing `ls` to see and `exit` to exit
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


[COMMANDS]
touch myfile // use in linux