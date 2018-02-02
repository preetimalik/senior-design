//SHOUT
// this is the id of the form

var token;
var hammertime;
var isMobile;
//window.isAnon =false;
window.onload = function() {

    //$.removeCookie('isAnon');
    var p_img= $('#tb_user_option').find('img');
    var name_a= $('a#top_username');
    if (typeof $.cookie('isAnon') === "undefined") {
        $.cookie('isAnon', false, { expires: 7 });
    }
    if(($.cookie('isAnon')=== 'true')) {
        p_img.attr("src","/img/anonymous_32.png");
    }
    else{
        p_img.attr("src","/img/profile_pic_32.jpg");
    }

    token = $.cookie('token');
    //QUERY NOTIFACTION COUNT AND SET NOTIFICATION
    notif_count_check();
    openChannel();



    var myElement = document.getElementById("shout_area");
    hammertime = new Hammer(myElement);
    console.log(hammertime);
    isMobile = false;
    //Check if mobile
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        isMobile = true;
    }

    //*******HAMMER Smartphone touch detection********88
    if(isMobile){
        console.log('phone view');
        hammertime.on("swiperight panright panend", function(event){
            console.log(event+"---");
            var shout_area = $("#shout_area");
            //var initialpos = $("#shout_area").offset();
            switch(event.type){
                //On swiperight, just remove the shout area
                case 'swiperight':
                    console.log("You swiped right!");
                    shout_area.hide();
                    break;

                case 'panright':

                    console.log(event.deltaX);
                    //shout_area.style.transform = 'translate(angry)' + event.deltaX + 'px)';

                    shout_area.css({left: event.deltaX});
                    break;

                case 'panend':
                    if(event.deltaX >= screen.width/2){
                        console.log("Passed Halfway!!");
                        shout_area.animate({left: screen.width},300,'swing',function(){
                            console.log("I LIKE PRO|toNSTS");
                            //shout_area.css("visibility", "hidden");
                            shout_area.hide();
                            shout_area.css({left: 0});
                        });
                    }else{
                        shout_area.css({left: 0});
                    }
                    break;
            }

        });
    }

};

//NOTIFICATIONS
openChannel = function(){
    var channel = new goog.appengine.Channel(token);
    var socket = channel.open();
    socket.onopen = onOpen;
    socket.onmessage = onMessage;
    socket.onerror = onError;
    socket.onclose = onClose;
};

function onError() {
    console.error("failed to opened channel")
}

function onClose() {
    console.log("closed channel")
}

function onOpen() {
    console.log("opened channel")
}

function onMessage(msg) {
    var jmsg = JSON.parse(msg.data);
    //console.log("Longityde: " + jmsg.dataLat + " Latitude: " + jmsg.dataLat + " Type: " + jmsg.type);
    if(jmsg.type == 'map'){
        update_map(jmsg.dataLat,jmsg.dataLon);
    }else{
        notify_inc();
        console.log(jmsg.message);
    }
    noty({
        text: jmsg.message,
        layout: 'bottomLeft',
        closeWith: ['click'],
        type: 'information'
    });
}


$(document).ready(function(){
    $("#closeSModal").click(function() {
        $('#shoutModal').foundation('reveal', 'close');
    });
});





$(document).ready(function(){
    $('.page-button').mouseenter(function () {
        $(this).css('box-shadow', '0px 1px 2px #888').animate({
            borderWidth: 0
        }, 100);
    }).mouseleave(function () {
        $(this).animate({
            borderWidth: 0
        }, 100);
    });
});



