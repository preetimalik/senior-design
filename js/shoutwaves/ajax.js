/**
 * Created by Mehran on 3/22/2015.
 */
function notification_bt(event){
    $('#user_menu').hide();
    $("#u_search_result").html('').hide();
    $('#search_input').blur().val('');
    $('#notification_menu').show();
    $('.notification-counter').text('').hide(); // clear notifications
    $.ajax({
        type: "POST",
        url: "/nclear"
    });
    event.stopPropagation();
}


function SearchUser(name, result_div){
    $.ajax('/search/user/',{
        type: 'GET',
        data: {
            dataType: 'json',
            //username: name ,
            //tag_list: getTag_list()
            data: JSON.stringify({ tag_list: getTag_list_username(), name:name })
        },
        success: function(responseText){
            showUserSearch(responseText,result_div);
        },
        error: function(req, status, err){
            console.log( 'something went wrong', status, err );
            isUserTagging = false;
        }

    });
}

function SearchHashTag(hashtag, result_div){
    console.log(hashtag);
    //$.ajax('/search/user/',{
    //    type: 'GET',
    //    data: {
    //        dataType: 'json',
    //        //username: name ,
    //        //tag_list: getTag_list()
    //        data: JSON.stringify({ tag_list: getTag_list_username(), name:name })
    //    },
    //    success: function(responseText){
    //        showUserSearch(responseText,result_div);
    //    },
    //    error: function(req, status, err){
    //        console.log( 'something went wrong', status, err );
    //        isUserTagging = false;
    //    }
    //
    //});
}



//post shout ajax call
function PostShout(){
    var shout_modal = $('#shoutModal');
    var shout_div = $('#shout_area');
    var url = "/shout"; // the script where you handle the form input.
    var form_data = $("#map-shout-form").serialize();
    var shoutContent = $("#post_shout_ta").text();
    var isAnon=$.cookie('isAnon');
    $.ajax({
        type: "POST",
        url: url,
        data: form_data+'&isAnon='+isAnon + '&lat=' + shout_modal.attr('Lat')+ '&lng='+shout_modal.attr('Lng')+ '&shoutContent='+shoutContent+
        "&tag_list="+JSON.stringify({tag_list: getTag_list()})+"&hashtag_list="+JSON.stringify($("#hash_tag_shout_ta").tagsManager('tags')),
        //add loading
        success: function(data)
        {
            shout_div.find(".mCSB_container").find('.new_shout').prepend(data); //load new content inside .mCSB_container
            shout_div.mCustomScrollbar("update"); //update scrollbar according to newly loaded content
            shout_div.find(".comments-div").mCustomScrollbar("scrollTo","top",{scrollInertia:500});
            $('#shoutModal').foundation('reveal', 'close');
            $("#post_shout_ta").text('');
            $("#hash_tag_shout_ta").tagsManager('empty')
        }
    });

    //return false; // avoid to execute the actual submit of the form.
}


//ajax show comment methods
function showCommentsAjax(shout_id){
    //if closed make ajax call
    if($("#post_comment_div_"+shout_id).css('display') == 'none') {
        $.ajax('/shout/comments/', {
            type: 'GET',
            data: {
                dataType: "json",
                shout_id: shout_id
            },
            success: function (data) {
                expandComments(shout_id, data);
            },
            error: function (req, status, err) {
                console.log('something went wrong', status, err);
            }
        });
    }
    //don't make ajax call if open
    else{
        expandComments(shout_id);
    }
}

//making comment ajax call
function handlePostComment(shout_id){
    var comment_div = $('#post_comment_div_'+shout_id);
    var content= $("#commentTextArea_"+shout_id);
    var content_text = content.text();
    content.text('');
    //$('#make_comment_bt_'+shout_id).hide("blind",'slow');


    $.ajax('/comment/',{
        type: 'POST',
        data:{
            post_id: shout_id,
            comment_content: content_text
        },
        success: function (data) {
            comment_div.find(".mCSB_container").append(data); //load new content inside .mCSB_container
            comment_div.mCustomScrollbar("update"); //update scrollbar according to newly loaded content
            comment_div.find(".comments-div").mCustomScrollbar("scrollTo","bottom",{scrollInertia:500});
        },
        error: function (req, status, err) {
            console.log('something went wrong', status, err);
        }

    });
}

//like post
function likeContentAjax(isShout,shoutId,commentId,like_text){
    var like_count,val,is_like;
    console.log(like_text.text);
    var url='/like/';
    if(isShout){
        url += 'shout/'+shoutId;
        like_count = $('#shout_like_count_'+shoutId);
    }
    else{
        url += 'comment/'+commentId;
        like_count = $('#comment_like_count_'+commentId);
    }
    val = parseInt(like_count.text());

    if(like_text.text ==='Like'){
        $(like_text).text('Unlike');
        is_like='True';
        val++;
    }
    else{
        $(like_text).text('Like');
        is_like='False';
        val--;
    }
    like_count.text(val);
    $.ajax(url,{
        type: 'POST',
        data:{
            shout_id:shoutId,
            is_like: is_like
        },
        success: function (data) {

        },
        error: function (req, status, err) {
            console.log('something went wrong', status, err);
        }

    });
}

function updateInfo(changed){
    var url = "info";
    switch(changed){
        case 'name':
            var newName = $('#newName').val();
            if(newName==""){
                //Add an error message.
                return;
            }else{
                //Remove error message.
            }
            console.log("NewName T|est: " + newName);
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    type: changed,
                    newValue: newName
                },
                success: function(responseText){
                    $('#newName').val('');
                    $('#settingsModal').foundation('reveal', 'close');
                    console.log("Changed Username");
                },
                error: function(req, status, err){
                    console.log( 'something went wrong', status, err );
                }
            });

            break;
        case 'password':
            var currentPass = $('#currentPass').val();
            var newPass = $('#newPass').val();
            var confirmPass = $('#confirmPass').val();
            if(currentPass=="" || newPass=="" || confirmPass==""){
                return;
            }
            $.ajax({
                type: 'POST',
                url: url,
                data: {
                    type: changed,
                    oldValue: currentPass,
                    newValue: newPass
                },
                success: function(responseText){
                    if(responseText == 'Failed'){
                        console.log("Failed to change password");
                        $('#currentPass').val('');
                        $('#newPass').val('');
                        $('#confirmPass').val('');
                        return;
                    }
                    $('#currentPass').val('');
                    $('#newPass').val('');
                    $('#confirmPass').val('');
                    $('#settingsModal').foundation('reveal', 'close');
                    console.log("changed password");
                }
            });
            break;

        case 'picture':

            break;
        case 'deactivate':
            $.ajax({
               type: 'POST',
                url: url,
                data: {
                    type: changed
                }
            });
            break;
    }

}

//Upload File Buttton Click Event
$('#get_file').click(function() {
        document.getElementById('my_file').click();
});

//document.getElementById('get_file').onclick = function() {
//    document.getElementById('my_file').click();
//};

function showSettings(){
    $('#settingsModal').foundation('reveal', 'open');
}

$('#settingsModal').on('opened',function(){
    $(this).foundation('section','reflow');
});


