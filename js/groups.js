//	    var socket = io.connect('http://localhost:3000');
	    var socket = io.connect();

		socket.on('allUsers', function(listOfUsers) {
			$('#allUsers').html("");
			listOfUsers.forEach(function (item, index) 
			{
				if(item != null)
				{
					var s = '<button type="button" class="btn space btn-primary">' + item + '</button>';
				    $('#allUsers').append(s);
				}
			});
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
			if(group.name != null)
			{
				var divid = "#g" + group.group;
			   	$(divid).append('<button type="button" class="btn space btn-success">'+group.name+"</button>");
			}
		});         

		socket.on('created', function(id) {
		   	$("div#code").html(id);
		});         

