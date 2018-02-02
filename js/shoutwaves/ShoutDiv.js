/**
 * Created by Mehran on 3/24/2015.
 */

//var comment_input= $();
var maxCommentChar = 200;

$(window).load(function() {
    $(".comments-div").mCustomScrollbar({
        scrollButtons: {
            enable: true
        }
    });
});







function expandComments(shout_id, comments) {
//for (i = 0; i < 15; i++) {
//   handlePostComment(shout_id);
//}
//
//    return;

    var post_comment_div = $("#post_comment_div_"+shout_id);
    var comment_div = post_comment_div.find(".comments-div");
    //only toggle if no data, for closing
    if(jQuery.isEmptyObject(comments)){
        post_comment_div.toggle( "blind",'slow');
    }
    //add data if any
    else{
        comment_div.find(".mCSB_container").html(comments); //load new content inside .mCSB_container
        comment_div.mCustomScrollbar("update"); //update scrollbar according to newly loaded content
        post_comment_div.toggle( "blind",'slow');
    }
//    post_comment_div.toggle( "blind",'slow',function(){
//        post_comment_div.find(".comments-div").mCustomScrollbar("scrollTo","bottom",{scrollInertia:500});
//    });
}

//making comment
$(document).on('keypress','.comment-input',function(e){
    if ((e.keyCode == 13 && e.shiftKey)||($(this).text().length>=maxCommentChar)) {
        e.preventDefault();
    }
});
$(document).on('focus','.comment-input',function(e){
    $('#make_comment_bt_'+$(this).data('shoutid')).show("blind",'slow');
});
$(document).on('focusout','.comment-input',function(e){
    if($(this).text().length==0)
        $('#make_comment_bt_'+$(this).data('shoutid')).hide("blind",'slow');
});

$(document).on('click','.cancelComment',function(){
    $(this).parent().hide("blind",'slow');
});

$(document).on('paste','.comment-input',function(e) {
    e.preventDefault();
    var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
    window.document.execCommand('insertText', false, text);
});