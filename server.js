var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);

//http://stackoverflow.com/questions/29854405/sending-array-from-server-to-client-with-socket-io

server.listen(3000);

app.use("/js", express.static(__dirname + "/js"));
app.use("/css", express.static(__dirname + "/css"));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/admin.html', function (req, res) {
  res.sendfile(__dirname + '/admin.html');
});

var allInstances = Array();

console.log("MaxSockets: " + http.globalAgent.maxSockets);




function getServer(code)
{
	console.log("getServer " + code);
	var server = allInstances[code];
	if(typeof server == 'undefined')
	{
		console.log("No instance for " + code);
		return false;
	} 
	return server;
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getUser(s)
{
	var u = {
	 id : s.id,
	 name: s.pseudo
	};
	return u;
}

function createServer(id, socket)
{
    console.log("Create server " + id);
	var allClients = Array();

	var server = {
      serverSocket: socket,
      code: id,
      allClients: allClients,
      broadcastToAll : function(msg, data) {
		console.log("broadcastToAll " + msg);
		console.log("broadcastToAll " + data);
        this.serverSocket.emit(msg, data);
        this.broadcastToClients(msg, data);
      },	
      broadcastToClients : function(msg, data) {
		console.log("broadcastToClients " + msg);
		console.log("broadcastToClients " + data);
		this.allClients.map(function(s) {
    		s.emit(msg, data);
		});
	  },
	  addClient : function(socket) {
	  	this.allClients.push(socket);
	  },
	  isServerSocket : function(socket) {
	    if(this.serverSocket == socket)
	    {
	    	console.log("Found server socket");
	    	return true;
	    }
    	return false;
	  },
	  removeClient : function(socket) {
	  	var i = this.allClients.indexOf(socket);
	  	if(i > -1)
	  	{
	  	   console.log("Found client socket. Removing it.");
	  	   var user = getUser(socket);
	  	   this.broadcastToAll("removeUser", user); 
		   this.allClients.splice(i, 1);
		   return true;
		}
		return false;
	  },
	  getUsers : function ()
	  {
	    console.log("getUsers");
		var users = this.allClients.map(function(s) {
	        if (typeof s.pseudo != 'undefined')
			{
				return getUser(s);
			}
		});
		console.log("getUsers " + users);
		return users;
	  },
	  shuffleClients : function() {
		  var currentIndex = this.allClients.length, temporaryValue, randomIndex;

		  // While there remain elements to shuffle...
		  while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this.allClients[currentIndex];
			this.allClients[currentIndex] = this.allClients[randomIndex];
			this.allClients[randomIndex] = temporaryValue;
		  }
		  return this.allClients;
	 }
    };
    allInstances[id] = server;
    return server;
}

io.on('connection', function (socket) {
        console.log("New connection");

        socket.on('groupsconnect', function(code) {
        	console.log("connect " + code);
        	var server = getServer(code);
        	if(!server)
        	{
        		return;
        	}
		    console.log("Emit all users");
		    var users = server.getUsers();
		    console.log(users);
	 		socket.emit('groupsconnected');
	 		socket.emit('allUsers', users);
		    server.addClient(socket);
        });

        socket.on('create', function() {
            console.log("Create");
        	var id = "";
        	var idFound = false;
        	while(!idFound)
        	{
        		id = makeid()
        		if(!allInstances[id])
        		{
        			idFound = true;
        		}
        	}
        	console.log("Id " + id);
        	createServer(id, socket);
        	socket.emit('created', id);
		});
		
        socket.on('newUser', function(data) {
	        console.log("newUser");
        	var pseudo = data.pseudo;
	        console.log("pseduo " + pseudo);
        	var code = data.code;
        	console.log("Code " + code);
        	var server = getServer(code);
        	if(!server)
        	{
        		return;
        	}
        	var oldUser = getUser(socket);

	        if (typeof socket.pseudo != 'undefined')
	        {
	        	if(socket.pseudo != pseudo) //User changed name
	        	{
		       	    socket.pseudo = pseudo;
					var u = getUser(socket);
		        	console.log("Broadcast changeUser");
		            server.broadcastToAll('changeUser', u);
				}
	        }
	        else //it's a new user
	        {
	       	    socket.pseudo = pseudo;
				var u = getUser(socket);
    	        server.broadcastToAll('newUser', u);
			}
       });
	   socket.on('divide', function (data) {
		 var code = data.code;
		 console.log("Divide code " + code);
		 var server = getServer(code);
		 if(!server)
		 {
	 		 return;
		 }
	     
		 console.log('Divide in no of groups:' + data.noOfGroups);
 	     
		 var allClients = server.shuffleClients();
		 var noOfGroups = data.noOfGroups;
		 console.log("emit noOfGroups");
 	     server.broadcastToAll('noOfGroups', noOfGroups);
		 console.log('No of groups:' + noOfGroups);
		 
		 var arrayLength = allClients.length;

		 var groupNo = 1;
		 for (var i = 0; i < arrayLength; i++) {
  	        if (typeof allClients[i].pseudo != 'undefined')
			{
				console.log('Group:' + groupNo + ' Name:' + allClients[i].pseudo);
				var u = getUser(allClients[i]);
				server.broadcastToAll('group', 
				{
					group: groupNo,
					user: u
				}
				);
				groupNo++;
				if(groupNo > noOfGroups)
				{
					groupNo = 1;
				}
			}
			else
			{
				console.log('Skip undefined socket pseudo');
			}
		}		 
	   });
	   // listen for the chat even. and will recieve
	   // data from the sender.
	   socket.on('chat', function (data) {
		 console.log(data);
		  // broadcast data recieved from the sender
		  // to others who are connected, but not
		  // from the original sender.
		  io.sockets.emit('chat', data);
	   });


	   socket.on('disconnect', function() {
		  console.log('Got disconnect!');

		  var bFound = false;
		  for (var key in allInstances) {
			console.log("key " + key);
		  	var server = getServer(key);
		  	if(server.isServerSocket(socket))
		  	{
			   	var i = allInstances.indexOf(key);
			  	if(i > -1)
		  	    {
		  	      console.log("Removing instance");
			      allInstances.splice(i, 1);
			    }
		  		break;	
		  	}
		  	if(server.removeClient(socket))
		  	{
			   break;
			}
		  }
	  });
});
