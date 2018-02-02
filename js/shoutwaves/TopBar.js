/**
 * Created by Mehran on 3/22/2015.
 */



//SETTING MENU
function user_option_bt(event){
    hideMenu();
    $('#user_menu').show();
    event.stopPropagation();
}

$('#toggle_shout_div').click(function(){
    toggleShoutDiv();

});

$('#anon_toggle').click(function() {
    var p_img= $('#tb_user_option').find('img');
    var anon = '/img/anonymous_32.png';
    if(($.cookie('isAnon')=== 'true')) {
        p_img.attr("src","/img/profile_pic_32.jpg");
        $.cookie('isAnon', false);
    }
    else{
        p_img.attr('src',anon);
        $.cookie('isAnon', true);
    }
});

$('#setting_bt').click(function() {
    showSettings();
});

//NOTIFICATION
function notif_count_check(){
    var n_counter= $('.notification-counter');
    if(n_counter.text()== ''){
        n_counter.hide();
    }
}

function notify_inc() {
    var counter = $('.notification-counter');
    var val=0;
    if(counter.text()== ''){
        val ++;
    }else{
        val = parseInt(counter.text());
        val ++;
    }
    var css_top=counter.css('top');
    counter.hide();
    counter.css({"top": "-1rem"});
    counter.text(val);
    counter.show();
    counter.animate({top: css_top}, 300 );
}



//SEARCH
//expanding
$("#search_bt").click(function() {
    var input= $("#search_input");
    var topBar_width=$(".topbar").css("width");
    if($(this).hasClass("active")){
        input.removeClass("input_active");
        input.css({width: "0"});
        $(this).removeClass("active");
    }
    else{
        $(this).addClass("active");
        input.addClass("input_active");
        if(isM2Screen()){
            input.css({width: topBar_width});
        }else {
            input.css({width: "100%"});
        }
    }
});
//input
$("#search_input").keyup(function(e){
    var u_reslut = $("#u_search_result");
    if($(this).val().length>2){
        SearchUser($(this).val(),u_reslut);
    }
    else{u_reslut.html('').hide();}
});
//user search click
$("#u_search_result").on("click", "li", function(event){
    window.location.replace("/user/"+$(this).attr('id'));
});

//HELPER FUNCTIONS
$('html').click(function() {
    $('#user_menu').hide();
    $('#notification_menu').hide();
    $("#u_search_result").html('').hide();
});

function hideMenu(){
    $("#u_search_result").html('').hide();
    $('#search_input').blur().val('');
    $('#notification_menu').hide();
    $('#user_menu').hide();
}

//Close on the Settings Modal
$(document).ready(function(){
    $("#closeSModal2").click(function() {
        $('#settingsModal').foundation('reveal', 'close');
        //alert("hi!");
    });
});