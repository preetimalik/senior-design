/**
 * Created by Mehran on 3/22/2015.
 */
var shout_area =$('#shout_area');
$(document).ready(function(){
    $(":checkbox").labelauty();
    $(".private").labelauty({ minimum_width: "155px" });
//	$(".to-labelauty-icon").labelauty({ label: false });
});

$(window).on('resize', function(){
    var wh_map = ($(window).height() / parseFloat($("body").css("font-size")))- 4.063 ;
    //constantly change size if re-sized
    shout_area.css("height", wh_map+"rem")
    if(!isM1Screen){
        shout_area.css("width", "34.56rem")
    }
});

//screen calculations
function remCalc(sizePx){
    return sizePx/16;
}
function isM0Screen(){
    return remCalc($(window).width()) < 25;
}
function isM1Screen(){
    return remCalc($(window).width()) < 35.31;
}
//same as foundation small-medium
function isM2Screen(){
    return remCalc($(window).width()) < 40.125;
}

function toggleShoutDiv()
{
    if(shout_area.hasClass("hide-shout-div")){
        shout_area.removeClass("hide-shout-div",'slow','easeOutBounce');
    }
    else{
        shout_area.addClass("hide-shout-div",'slow','easeInQuart');
    }
 }