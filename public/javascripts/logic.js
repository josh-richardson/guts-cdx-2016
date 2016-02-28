/**
 * Created by joshuarichardson on 22/02/2016.
 */
jQuery(function($) {
    var socket = io.connect();
    var $nickForm = $('#setNick');
    var $nickError = $('#nickError');
    var $nickBox = $('#nickname');
    var $messageForm = $("#send-message");
    var $messageBox = $("#message");
    var $messageCsrf = $("#message-csrf");
    var $chat = $("#chat");
    var $users = $("#users");

    $nickForm.submit(function(e) {
        e.preventDefault();
        socket.emit("newuser", $nickBox.val(), function(data) {
            if (data) {
                $("#nickWrap").hide();
                $("#contentWrap").show();
            } else {
                $nickError.html("That username is taken, please try again!");
            }
        });
        $nickBox.val("");
    });



    //$(document).ready(function() {
    //    $.getScript("/javascripts/obf2.js", function(){
    //    });
    //});


    $messageForm.submit(function(e) {
        e.preventDefault();
        socket.emit("send message", $messageBox.val(), $messageCsrf.val());
        $messageBox.val("");
    });

    socket.on("new message", function(data) {
        $chat.append("<b>" + data.nick + "</b>: " + data.msg + "<br/>")
    });

    socket.on("csrf", function(data) {
       $messageCsrf.val(data);
    });

    socket.on("usernames", function(data) {
        var html = '';
        for(i = 0; i < data.length; i++) {
            html += data[i] + "<br/>"
        }
        $users.html(html);
    });


});