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

function getUsers(allClients)
{
	var users = allClients.map(function(s) {
    	return s.pseudo;
	});
	return users;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

io.on('connection', function (socket) {
        console.log("New connection");

        socket.on('connect', function(id) {
        	console.log("connect");
        	var allClients = allInstances[id];
		    console.log("Emit all users");
	 		socket.emit('allUsers', getUsers(allClients));
        
		    allClients.push(socket);
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
			var allClients = Array();
        	allInstances[id] = allClients;
        	socket.emit('created', id);
		});
		
        socket.on('newUser', function(data) {
        	var pseudo = data.pseudo;
        	var id = data.code;
        	var allClients = allInstances[id];
	        console.log("newUser");
	        console.log(socket.pseudo);

	        if (typeof socket.pseudo != 'undefined')
	        {
	        	if(socket.pseudo != pseudo)
	        	{
		        	console.log("Emit changeUser");
		            allClients.emit('changeUser', 
			        {
        				 oldName : socket.pseudo,
			    	     newName : pseudo
				    });
				}
	        }
	        else
	        {
    	        allClients.emit('newUser', pseudo);
			}
            socket.pseudo = pseudo;
			
			//Broadcast update names for users.
			//Can be changed to check whether a user sent the same name twice.
		    console.log("Emit user names:");
	  	    console.log(getUsers());
		    allClients.emit('allUsers', getUsers());
        });
	   socket.on('divide', function (data) {
	     if(data.pw != "workshop")
	     {
	     	return;
	     }
	     
		 console.log('Divide in no of groups:' + data.noOfGroups);
 	     
		 var arr = shuffle(allClients);
		 var noOfGroups = data.noOfGroups;
		 console.log("emit noOfGroups");
 	     io.sockets.emit('noOfGroups', noOfGroups);
		 console.log('No of groups:' + noOfGroups);
		 
		 var arrayLength = allClients.length;

		 var groupNo = 1;
		 for (var i = 0; i < arrayLength; i++) {
  	        if (typeof allClients[i].pseudo != 'undefined')
			{
				console.log('Group:' + groupNo + ' Name:' + allClients[i].pseudo);
				io.sockets.emit('group', 
				{
					group: groupNo,
					name: allClients[i].pseudo
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
		  	var allClients = allInstances[key];
		  	var i = allClients.indexOf(socket);
		  	if(i > -1)
		  	{
		  	   console.log("Removing socket");
			   allClients.splice(i, 1);
			   break;
			}
		  }
	  });


//	  socket.emit('news', { hello: 'world' });
});
