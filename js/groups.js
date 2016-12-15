//	    var socket = io.connect('http://localhost:3000');
	    var socket = io.connect();

		function getNameHtml(user)
		{
			var id = user.id;
			var name = user.name;
			var s = '<button type="button" class="btn space btn-primary" id="u_' + id + '">' + name + '</button>';
			return s;
		}
		function getGroupMemberHtml(user)
		{
			var id = user.id;
			var name = user.name;
			var s = '<button type="button" class="btn space btn-success" id="g_' + id + '">' + name + '</button>';
			return s;
		}
		
		socket.on('allUsers', function(listOfUsers) {
			$('#allUsers').html("");
			listOfUsers.forEach(function (user, index) 
			{
				if(user != null)
				{
				    $('#allUsers').append(getNameHtml(user));
				}
			});
		});         
		socket.on('groupsconnected', function() {
			$('div#connected').show();
		});
		socket.on('newUser', function(user) {
			$('#allUsers').append(getNameHtml(user));
		});
		socket.on('changeUser', function(data) {
			var uid = "button#u_" + data.id;
			var gid = "button#g_" + data.id;
			$(uid).html(data.name);
			$(gid).html(data.name);
		});
		socket.on('removeUser', function(data) {
			var uid = "button#u_" + data.id;
			var gid = "button#g_" + data.id;
			$(uid).remove();
			$(gid).remove();
		});

		socket.on('noOfGroups', function(noOfGroups) {
			var e = $('div#groups');
			e.html("");
			for(i = 1; i <= noOfGroups; i++)
			{
				var s = "g" + i ;
				var g = "Gruppe " + i;
				var l = '<button type="button" class="btn space btn-primary">'+ g + '</button><br/>';
				var h = '<div class="col-sm-2"><div class="well" id="' + s + '">'+ l + '</div></div>';
				e.append(h);
		    }
			e.append('</div>');
		});         

		socket.on('group', function(group) {
			var divid = "#g" + group.group;
			var s = getGroupMemberHtml(group.user);
		   	$(divid).append(s);
		});         

		socket.on('created', function(id) {
		   	$("div#code").html(id);
		});         

