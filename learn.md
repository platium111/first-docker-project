
```FROM node:15
WORKDIR /app
COPY package.json . // . is refer to app because already set in WORKDIR
  // we can use COPY package.json /app
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

* I tried to change package.json , here is the result -> will not display cache in step 3/7
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
    `docker run -p 4000:3000 -d -v 'D:\2. Code\1.learn code\6.devops nodejs\first-project\':/app --name myContainerForFirstApp first-app`
    `docker run -p 4000:3000 -d -v %cd%:/app --name myContainerForFirstApp first-app` // windows shell, `${pwd}` for power shell
    * need full path for the first one, `.` is not working
  * still not working when we change the file -> because whenever you change the code, need to run `node index.js` again -> using nodemon for now
