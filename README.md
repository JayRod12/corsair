CORSAIR
======

Clone
-----
Clone into your working directory (any directory in your local machine) from:

* git@gitlab.doc.ic.ac.uk:web5app/treas.git (Using SSH)

* https://gitlab.doc.ic.ac.uk/web5app/treas.git (Using https)

Run
---

Install node (from nodejs.org);
1. Enter **treas** directory
2. Run **npm install** (this installs all dependencies in package.json)
3. Run **node server_scripts/app.js**
4. Go to **http://localhost:3000**


Sockets and Networking Details
------------------------------

Connection handshake:

~~~
          CLIENT                            SERVER
(http connection)       ->

                        <-    (deliver client sources)

(socket io connection)  ->

                        <-    'on_connect'
                              data = 
                                meta : metadata containing
                                       gridNumber, cellWidth, cellHeight,
                                       activeCells
                                       Where activeCells is a list of all the
                                       cells considered by the client

                                id      : userid generated for client
                                state   : ship state the client will spawn with
                                names   : mapping from uid to player name
                                players : mapping from uid to player states

 'on_connect_response' ->
 data = 
   name : clients name
                       <-   'run_game'
                             no data, used to signify that the server is ready
                             for the client to begin simulating the game

                             
  To all other players <-     'player_joined'
                              data =
                                id    : id of new player
                                name  : name of new player
                                state : state of new player
~~~

Tick cycle



~~~
          CLIENT                            SERVER
 'client_update'      ->
 data = 
  state : ship state of the client


                      <-    'server_update'
                             data = 
                               mapping from userid to ship state
~~~



On disconnect

~~~
          CLIENT                            SERVER

 'disconnect'        ->

 To all other players <-     'player_left'
                             data = 
                              id : userid of leaving player
~~~









Other info
----------
Group Directory:
/vol/project/2015/271/g1527124/web/

Web address for group directory:
http://www.doc.ic.ac.uk/project/2015/271/g1527124/web/

Add **umask 002** to ~/.cshrc. Or other file if you use a different shell.

Before creating new subdirectory in group directory do:
**chmod g+ws NEW_DIR_NAME**, to ensure proper permissions.


