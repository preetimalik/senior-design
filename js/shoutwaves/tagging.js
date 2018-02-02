/**
 * Created by Mehran on 3/22/2015.
 */
var isUserTagging=false;
var isHashTagging=false;
var username;
var hashtag;
var hashtagButton;
var tagListDiv = $('#tagging_user_list');


var postShout_ta = $('#post_shout_ta');
function userTag(name,username,id) {
    this.name = name;
    this.username = username;
    this.user_id = id;
}
//record tag
postShout_ta.keypress(function(e){
    var tag =  String.fromCharCode(e.charCode);
    if(isUserTagging && username.length > 0){
        username = username + tag;
        SearchUser(username.substring(1, username.length), tagListDiv);
    }
    if(isHashTagging && hashtag.length > 0){
        hashtag = hashtag + tag;
        SearchHashTag(hashtag.substring(1, hashtag.length), tagListDiv);
    }
    //user hits @
    if((e.charCode  == 64)&&(!isHashTagging)){
        isUserTagging = true;
        username = "@";
    }
    //user hit #
    if((e.charCode == 35)&&(!isUserTagging)){
        e.preventDefault();
        isHashTagging = true;
        hashtag = "#";
    }
});

//search for tag
postShout_ta.keyup(function(e){
    if(isUserTagging) {
        //space
        if (e.keyCode == 32) {
            tagListDiv.html('').hide().parent().hide();
            isUserTagging = false;
            return;
        }
        //backspace, delete will clear list
        if (e.keyCode == 46 || e.keyCode == 8) {

            username = username.substring(0, username.length - 1);
            if (username.length == 1) {
                tagListDiv.html('').hide().parent().hide();
            }
            else if (username.length == 0) {
                isUserTagging = false;
            }
            else {
                SearchUser(username.substring(1, username.length), tagListDiv);
            }
        }
    }
    else if(isHashTagging) {

        //space
        if (e.keyCode == 32) {
            tagListDiv.html('').hide().parent().hide();
            //postShout_ta.html(postShout_ta.html()+'<br>');
            //postShout_ta.append("&nbsp;");
            isHashTagging = false;
            placeCaretAtEnd(this);
            return;
        }
        //backspace, delete will clear list
        if (e.keyCode == 46 || e.keyCode == 8) {
            e.preventDefault();
            hashtag = hashtag.substring(0, hashtag.length - 1);
            //if (hashtag.length == 1) {
            //    tagListDiv.html('').hide().parent().hide();
            //}
            //else if (hashtag.length == 0) {
            //    isHashTagging = false;
            //}
            //else {
            //    SearchHashTag(hashtag.substring(1, hashtag.length), tagListDiv);
            //}
        }
    }
});




//selecting user to tag
tagListDiv.on("click", "li", function(event){
    var old = postShout_ta.html();
    var removed_text = old.substring(0, old.lastIndexOf("@"));
    postShout_ta.html(removed_text);
    var name = $(this).attr('username');
    var tag = $('<input>', {class: 'user_tag',type:'button', id: this.id, name: $(this).attr('name'),username: $(this).attr('username'), value:'@'+name});
    tag.html('@'+name);
    postShout_ta.append(tag);
    postShout_ta.append('<br>');

});

function getTag_list_username(){
    var text = $("#post_shout_ta");
    var tag_list= text.children(".user_tag");
    var tag_array= [];
    $.each( tag_list, function( index, tag ){
        //tag_array.push(new userTag(tag.name,tag_list.eq(index).attr("username"),tag.id))
        var username =new String(tag_list.eq(index).attr("username"));
        tag_array.push(username);
    });
    return tag_array;
}


function getTag_list(){
    var text = $("#post_shout_ta");
    var tag_list= text.children(".user_tag");
    var tag_array= [];
    $.each( tag_list, function( index, tag ){
        tag_array.push(new userTag(tag.name,tag_list.eq(index).attr("username"),tag.id))
    });
    return tag_array;
}




function showUserSearch(users, result_div){
    c_html = '';
    $.each(users, function(i, users){
        //var userID = users.ID;
        tagging_html =  '<li id='+users.id+' name='+users.name+' username='+users.username+'>'+
        '<img src="/img/anonymous_28.png">'+
        '<h5>'+users.name+'</h5>'+
        '<p>@'+users.username+'</p>'+
        '</li>';
        c_html += tagging_html;
    });
    result_div.html(c_html).show();
    result_div.parent().show();
}



function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
        && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}