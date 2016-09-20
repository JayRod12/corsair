CORSAIR
======


1. **git clone git://git@github.com:JayRod12/corsair.git**
2. Run **node server_scripts/app.js**
3. Go to **http://localhost:3000**

Deployed in **corsair.herokuapp.com**

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

