#!/usr/bin/env python

from google.appengine.ext.webapp import template
from google.appengine.ext import ndb

import logging
import os.path
import webapp2
import jinja2
import authenticate
import models
import os
import json
import urllib
import operator
import string
import re
import json as simplejson
import itertools
from webapp2_extras import auth
from webapp2_extras import sessions
from google.appengine.api import channel
from google.appengine.ext import ndb
from google.appengine.ext.db import Key
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError
from collections import Counter
from webapp2_extras import security
from google.appengine.ext import blobstore
from google.appengine.api import images
from google.appengine.ext.webapp import blobstore_handlers
from operator import itemgetter
import datetime

import webapp2
JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


class UserTag(ndb.Model):
    name = ndb.StringProperty()
    username = ndb.StringProperty()
    user_id = ndb.StringProperty()

class Notification(ndb.Model):
    content_key = ndb.KeyProperty(required=True)
    user_key = ndb.KeyProperty(required=True)
    is_anon = ndb.BooleanProperty()
    verb = ndb.StringProperty()
    unread= ndb.BooleanProperty(default=True)
    date = ndb.DateTimeProperty(auto_now_add=True)
    # 0-commented on your shout,
    # 1- you were tagged in a shout, 2-liked your shout
    # 3-taggeed you in a comment, 4-liked your comment
    @classmethod
    def query_by_key(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key).order(-cls.date)

class Shout(ndb.Model):
    author = ndb.KeyProperty(kind=models.User, indexed=True)
    userTags = ndb.StructuredProperty(UserTag, repeated=True)
    hashTags = ndb.StringProperty(repeated=True)
    Like = ndb.KeyProperty(repeated=True)
    # prop_count = ndb.ComputedProperty(lambda e: len(e.prop))
    # add followers(id) to shout to notify them and allow them to un-follow the shout to not get notification
    content = ndb.StringProperty()
    isAnon = ndb.BooleanProperty()
    isPrivate = ndb.BooleanProperty()
    location = ndb.GeoPtProperty()
    commentCount = ndb.IntegerProperty(default=0)
    date = ndb.DateTimeProperty(auto_now_add=True, indexed=True)

    @classmethod
    def query_profile_area(shout, user_id, get_all , sw ,ne):
        profile_qry = shout.query(ndb.OR(shout.userTags.user_id == user_id, shout.author == ndb.Key(models.User, int(user_id))))
        if get_all:
            return profile_qry
        else:
            return profile_qry.filter(Shout.location >= sw, Shout.location <= ne)

    @classmethod
    def query_area(shout,sw,ne):
        return shout.query(Shout.location >= sw, Shout.location <= ne).order()


class Comment(ndb.Model):
    # user_name = ndb.StringProperty()
    # change id to int and not indexed
    # user_id = ndb.StringProperty(indexed=True)
    author = ndb.KeyProperty(kind=models.User, indexed=True)
    Like = ndb.KeyProperty(repeated=True)
    content = ndb.StringProperty()
    isAnon = ndb.BooleanProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)


    @classmethod
    def query_comment(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key).order(+cls.date)


# HANDLERS
class ClearNotifications(authenticate.BaseHandler):
    @authenticate.user_required
    def post(self):
        noti = Notification.query(ancestor=self.user.key)
        noti = noti.filter(Notification.unread == True).fetch()
        for n in noti:
            n.unread = False
        ndb.put_multi(noti)


class MainWall(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self):
        # CREATE USER TOKEN
        token = channel.create_channel(str(self.user.key.id()), duration_minutes=None)
        # update notification
        n = Notification.query_by_key(self.user.key).fetch(20)
        unread_n = sum(p.unread == True for p in n)
        # upload_url = blobstore.create_upload_url('/uploadPic')
        template_values = {
            'token': token,
            'user': self.user,
            'unread_n': unread_n,
            'notifications': n
            # 'upload_url': upload_url
        }
        template = JINJA_ENVIRONMENT.get_template('views/explore.html')
        self.response.write(template.render(template_values))


class MainWallFilter(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self,*args, **kwargs):
        sw = ndb.GeoPt(float(self.request.get('sw_lat')), float(self.request.get('sw_lng')))
        ne = ndb.GeoPt(float(self.request.get('ne_lat')), float(self.request.get('ne_lng')))

        shout_dic = {}
        shout_dic['sw'] = sw
        shout_dic['ne'] = ne

        self.user.current_loc = shout_dic
        self.user.put()

        # shouts = Shout.query(Shout.location >= sw, Shout.location <= ne, Shout.date).order(+Shout.date)
        shouts = Shout.query_area(sw,ne).order(Shout.location).order(Shout.date).fetch()
        json_comments = get_shouts(self,shouts)
        self.response.out.headers['Content-Type'] = 'text/json'
        self.response.write(json_comments)


        # # USING DIC AND CLIENT SIDE RENDERING WITH JS
        # shout_dic = {}
        # i = 0;
        # for s in shouts:
        #     shout_dic['shout'+str(i)] = {}
        #     shout_dic['shout'+str(i)]['content'] = s.content
        #     shout_dic['shout'+str(i)]['ID'] = s.key.id()
        #     shout_dic['shout'+str(i)]['date'] = s.date
        #     shout_dic['shout'+str(i)]['isAnon'] = s.isAnon
        #     shout_dic['shout'+str(i)]['isPrivate'] = s.isPrivate
        #     shout_dic['shout'+str(i)]['lat'] = s.location.lat
        #     shout_dic['shout'+str(i)]['lng'] = s.location.lon
        #     if s.isAnon:
        #         shout_dic['shout'+str(i)]['user_name'] = 'Anonymous'
        #     else:
        #         shout_dic['shout'+str(i)]['user_name'] = s.user.get().name
        #         shout_dic['shout'+str(i)]['user_ID'] = s.user.id()
        #     i += 1
        #
        #
        # template_values = {
        #     'user_shouts': shout_dic
        # }

        # json_comments = json.dumps(shout_dic, default=date_handler)
        # self.response.out.write(json_comments)


class postShout(authenticate.BaseHandler):
    def post(self):
        # check if anon
        isAnon = self.request.get('isAnon')
        if isAnon == 'true':
            isAnon = True
        else:
            isAnon = False
        isPrivate = self.request.get('isPrivate')
        if isPrivate == 'on':
            isPrivate = True
        else:
            isPrivate = False

        jsonTags = self.request.get("tag_list")
        tags = json.loads(jsonTags)
        jsonHashTags = self.request.get("hashtag_list")
        hashtags = json.loads(jsonHashTags)

        loc = ndb.GeoPt(float(self.request.get('lat')), float(self.request.get('lng')))
        shout = Shout()
        shout.author = self.user.key
        shout.userTags = tags["tag_list"]
        shout.Like = []
        shout.hashTags = hashtags
        shout.content = self.request.get('shoutContent')
        shout.isAnon = isAnon
        shout.isPrivate = isPrivate
        shout.location = loc
        shout.put()

        # get one shout
        if len(shout.userTags) !=0:
            shout = addTags(self,[shout])[0]

        shout.LikeText='Like'
        if self.user.key in shout.Like:
            shout.LikeText='Unlike'

        template_values = {
            'Shout': shout,
        }
        template = JINJA_ENVIRONMENT.get_template('views/shout_one.html')
        shouts_html = template.render(template_values)
        self.response.out.write(shouts_html)

        self.shout_tag(shout)
        self.update_map(shout)

    def shout_tag(self, shout):
        for tag in shout.userTags:
            if int(tag.user_id) != self.user.key.id():
                n = Notification(parent=ndb.Key(models.User, int(tag.user_id)))
                n.content_key = shout.key
                n.user_key = self.user.key
                n.verb = "has tagged you in a Shout!"
                n.is_anon = shout.isAnon
                n.put()

                m = 'You were tagged in a shout by an Anonymous user.'
                if not n.is_anon:
                    m = 'You were tagged in a shout by '+self.user.username+'.'
                message_data = {
                    'type': 'user_tag',
                    'message': m
                }
                json_message = simplejson.dumps(message_data)
                channel.send_message(tag.user_id,json_message)


    def update_map(self, shout):
        # logging.info("Shout Location: " + str(shout.location))
        user_query = models.User.query(models.User.current_loc.sw <= shout.location).fetch()
        filtered = (s for s in user_query if s.current_loc.ne >= shout.location)
        # logging.info("Filted Results: " + str(filtered))

        m = 'Anonymous user has made a new Shout!'
        if not shout.isAnon:
            m = self.user.username+' has made a new Shout!'

        message_data = {
            'type': 'map',
            'dataLat': shout.location.lat,
            'dataLon': shout.location.lon,
            'message': m
        }

        json_message = simplejson.dumps(message_data)

        for u in filtered:
            # logging.info("HERE ARE THE USER IDs': " + str(users.key.id()))
            if u.key !=self.user.key:
                channel.send_message(str(u.key.id()), json_message)

class postComment(authenticate.BaseHandler):
    def post(self,post_id):
        shout_id = self.request.get('post_id')
        new_comment = Comment(parent=ndb.Key(Shout, int(shout_id)))
        # new_comment.shout_key = ndb.Key(Shout, post_id)
        new_comment.author = self.user.key
        new_comment.Like = []
        new_comment.content = self.request.get('comment_content')
        # logging.info(str(self.request.cookies.get("isAnon"))+'IS ANON'+str(type(self.request.cookies.get("isAnon"))))
        if str(self.request.cookies.get("isAnon")) == 'false':
            new_comment.isAnon = False
        else:
            new_comment.isAnon = True
        new_comment.put()
        # update number of comment count
        shout = ndb.Key('Shout', int(self.request.get('post_id'))).get()
        shout.commentCount += 1
        shout.put()
        if shout.author != self.user.key:
            self.notify(shout)
        # send back comment to user
        new_comment.LikeText='Like'
        comment_list = [new_comment]
        template_values = {
            'comments': comment_list
        }
        template = JINJA_ENVIRONMENT.get_template('views/comment.html')
        comments_html = template.render(template_values)
        self.response.out.write(comments_html)

    def notify(self, shout):
        n = Notification(parent=shout.author)
        n.content_key = shout.key
        n.user_key = self.user.key
        n.verb = "has commented on your Shout!"
        if str(self.request.cookies.get("isAnon")) == 'false':
            n.is_anon = False
        else:
            n.is_anon = True
        n.put()

        m = 'An Anonymous user has commented on your Shout.'
        if n.is_anon==False:
            m = self.user.username+' has commented on your Shout.'


        message_data = {
            'type': 'comment',
            'message': m
        }
        json_message = simplejson.dumps(message_data)
        channel.send_message(str(shout.author.id()),json_message)


class UpdateInfo(authenticate.BaseHandler):
    @authenticate.user_required
    def post(self):
        changed = str(self.request.get('type'))

        # Change the name
        if changed == 'name':
            logging.info("Changed Name")
            self.user.name = str(self.request.get('newValue'))
            self.user.put()

        # Change the password
        elif changed == 'password':
            oldPass = str(self.request.get('oldValue'))
            newPass = str(self.request.get('newValue'))
            # logging.info("Passed Old Passwpord: " + oldPass)

            if security.check_password_hash(oldPass, self.user.password) is False:
                self.response.write('Failed')
                return

            self.user.set_password(newPass)
            self.user.put()
            # logging.info("Password Changed")

        elif changed == 'picture':
            logging.info("Chnagee picture")

        elif changed == 'deactivate':
            logging.info("Deactivated Account")



class showComment(authenticate.BaseHandler):
    def get(self,*args, **kwargs):
        id = int(self.request.get('shout_id'))
        shout_key = ndb.Key(Shout, id)
        comments = Comment.query_comment(shout_key).fetch()
        for c in comments:
            c.LikeText='Like'
            if self.user.key in c.Like:
                c.LikeText='Unlike'

        # RENDER SHOUT HTML
        template_values = {
            'comments': comments
        }
        template = JINJA_ENVIRONMENT.get_template('views/comment.html')
        comments_html = template.render(template_values)
        self.response.out.write(comments_html)

        # converting into dict then json to send back
        # json_comments = json.dumps([dict(p.to_dict(), **dict(id=p.key.id())) for p in comments], default=date_handler)
        # self.response.out.headers['Content-Type'] = 'text/json'
        # self.response.out.write(json_comments)

class SearchUser (authenticate.BaseHandler):
    @authenticate.user_required
    def get(self,*args):
        jsonstring = self.request.get("data")
        data = json.loads(jsonstring)
        tag_list = data["tag_list"]
        user_search = str(data["name"]).lower()

        name_query = ndb.AND(models.User.name >= user_search, models.User.name <= user_search+u'\ufffd')
        username_query = ndb.AND(models.User.auth_ids >= user_search, models.User.auth_ids <= user_search+u'\ufffd')
        users = models.User.query(ndb.OR(name_query, username_query)).fetch(5)
        for tag in tag_list:
            users = [i for i in users if i.username != tag]

        user_dic = {}
        i = 0
        for u in users:
            user_dic['user'+str(i)] = {}
            user_dic['user'+str(i)]['name'] = u.name
            user_dic['user'+str(i)]['username'] = u.auth_ids
            user_dic['user'+str(i)]['id'] = u.key.id()
            i += 1

        json_users = json.dumps(user_dic)
        self.response.out.headers['Content-Type'] = 'text/json'
        self.response.write(json_users)

class GetUser (authenticate.BaseHandler):
    @authenticate.user_required
    def get(self, id=None):
        n = Notification.query_by_key(self.user.key).fetch()
        user_profile= ndb.Key(models.User, int(id)).get()


        template_values = {
            'user': self.user,
            'user_profile': user_profile,
            'notification': n
        }
        template = JINJA_ENVIRONMENT.get_template('views/profile.html')
        self.response.write(template.render(template_values))

class UserWallFliter(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self, id=None):
        sw = ndb.GeoPt(float(self.request.get('sw_lat')), float(self.request.get('sw_lng')))
        ne = ndb.GeoPt(float(self.request.get('ne_lat')), float(self.request.get('ne_lng')))
        shouts = Shout.query_profile_area(id,False,sw,ne).fetch()
        json_comments = get_shouts(shouts)
        self.response.out.headers['Content-Type'] = 'text/json'
        self.response.write(json_comments)


class LikeShout(authenticate.BaseHandler):
    @authenticate.user_required
    def post(self,id=None):
        shout = ndb.Key('Shout', int(id)).get()
        is_like = self.request.get("is_like")
        notifi = True
        if(is_like == 'True'):
            shout.Like.append(self.user.key)
        else:
            shout.Like.remove(self.user.key)
            notifi = False

        shout.put()
        if (shout.author != self.user.key) and notifi==True:
            self.notify(shout)

    def notify(self, shout):
        n = Notification(parent=shout.author)
        n.content_key = shout.key
        n.user_key = self.user.key
        n.verb = "has liked your Shout!"
        if str(self.request.cookies.get("isAnon")) == 'false':
            n.is_anon = False
        else:
            n.is_anon = True
        n.put()

        m = 'An Anonymous user has liked your Shout.'
        if not n.is_anon:
            m = self.user.username+' has liked your Shout.'

        message_data = {
            'type': 'like_shout',
            'message': m
        }
        json_message = simplejson.dumps(message_data)
        channel.send_message(str(shout.author.id()),json_message)

class LikeComment(authenticate.BaseHandler):
    @authenticate.user_required
    def post(self,id=None):
        shout_id = self.request.get("shout_id")
        is_like = self.request.get("is_like")
        comment = ndb.Key('Shout', int(shout_id),'Comment', int(id)).get()
        notifi = True
        if(is_like == 'True'):
            comment.Like.append(self.user.key)
        else:
            comment.Like.remove(self.user.key)
            notifi = False
        comment.put()

        if (comment.author != self.user.key) and notifi==True:
            self.notify(comment)

    def notify(self, comment):
        n = Notification(parent=comment.author)
        n.content_key = comment.key
        n.user_key = self.user.key
        n.verb = "has liked your comment."
        if str(self.request.cookies.get("isAnon")) == 'false':
            n.is_anon = False
        else:
            n.is_anon = True
        n.put()

        m = 'An Anonymous user has liked your comment.'
        if not n.is_anon:
            m = self.user.username+' has liked your comment.'

        message_data = {
            'type': 'like_comment',
            'message': m
        }
        json_message = simplejson.dumps(message_data)
        channel.send_message(str(comment.author.id()),json_message)



class getShout(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self,id=None):
        s = ndb.Key('Shout',int(id)).get()
        if len(s.userTags) !=0:
            s = addTags(self,[s])[0]
        s.LikeText='Like'
        if self.user.key in s.Like:
            s.LikeText='Unlike'

        token = channel.create_channel(str(self.user.key.id()), duration_minutes=None)
        # update notification
        n = Notification.query_by_key(self.user.key).fetch(20)
        unread_n = sum(p.unread == True for p in n)
        template_values = {
            'token': token,
            'user': self.user,
            'unread_n': unread_n,
            'notifications': n,
            'Shout': s
        }
        template = JINJA_ENVIRONMENT.get_template('views/shout_page.html')
        shouts_html = template.render(template_values)
        self.response.write(shouts_html)



# HELPER CLASSES
# class UploadPic(blobstore_handlers.BlobstoreUploadHandler):
#     def post(self):
#         upload_files = self.get_uploads('file')
#         blob_info = upload_files[0]
#         self.redirect('/serve/%s' % blob_info.key())
#
# class ServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
#     def get(self, resource):
#         resource = str(urllib.unquote(resource))
#         blob_info = blobstore.BlobInfo.get(resource)
#         self.send_blob(blob_info)


def date_handler(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError("Unserializable object {} of type {}".format(obj,type(obj)))

def get_shouts(self,shouts):
    # Tagging links
    shouts = addTags(self,shouts)
    hash_trends = hashTrend(self,shouts)
    shouts.sort(key=lambda r: r.date)
    shouts = shouts[::-1]


    # SORT SHOUTS BY DATE
    # shouts.sort(key=Shout.date, reverse=True)

    # RENDER SHOUT HTML
    template_values = {
        # 'user_shouts': user_shouts,
        'shouts': shouts,
        'hash_trends':jinja2.Markup(hash_trends)
    }
    template = JINJA_ENVIRONMENT.get_template('views/shout.html')
    shouts_html = template.render(template_values)


    # ADD SHOUT LOCATIONS
    shout_dic = {}
    shout_dic['shout_html'] = shouts_html
    shout_dic['shouts'] = {}
    for s in shouts:
        shout_dic['shouts'][str(s.key.id())] = {}
        shout_dic['shouts'][str(s.key.id())]['lat'] = s.location.lat
        shout_dic['shouts'][str(s.key.id())]['lng'] = s.location.lon
    return json.dumps(shout_dic)

def hashTrend(self, shouts):
    hashTags=[Shout.hashTags for Shout in shouts if len(Shout.hashTags) != 0]
    h_list = [i for i in itertools.chain.from_iterable(hashTags)]
    h_trends = Counter(h_list).most_common(6)
    h_trends = [elem[0] for elem in h_trends]
    h_trends_html =''
    for h in h_trends:
        h_trends_html += '<a class="hash_tag_trend" contenteditable="false" href="/tags/'+h+'">#'+h+'</a>'
    return h_trends_html

def addTags(self,shouts):
    for shout in shouts:
        c = shout.content
        shout.LikeText='Like'
        if self.user.key in shout.Like:
            shout.LikeText='Unlike'
        for tag in shout.userTags:
            t = '<a class="user_tag_shout" id="'+tag.user_id+'" name="'+tag.name+'" username="'+tag.username+'" contenteditable="false" href="/user/'+tag.user_id+'">@'+tag.username+'</a>'
            c = c.replace('@'+tag.username, t)
        for htag in shout.hashTags:
            t = '<a class="user_tag_shout" contenteditable="false" href="/tags/'+htag+'">#'+htag+'</a>'
            c += t
        shout.content = c

    return shouts

config = {
    'webapp2_extras.auth': {
        'user_model': 'models.User',
        'user_attributes': ['name']
    },
    'webapp2_extras.sessions': {
        'secret_key': 'YOUR_SECRET_KEY'
    }
}

app = webapp2.WSGIApplication([
                                  ('/explore', MainWall),
                                  ('/explore/(.*)', MainWallFilter),
                                  ('/shout', postShout),
                                  ('/shout/comments/(.*)', showComment),
                                  ('/comment/(.*)', postComment),
                                  ('/search/user/(.*)', SearchUser),
                                  ('/nclear', ClearNotifications),
                                  ('/info', UpdateInfo),
                                  # ('/uploadPic', UploadPic),
                                  # ('/serve/([^/]+)?', ServeHandler),
                                  webapp2.Route('/user/filter/<id>', handler=UserWallFliter,name='id'),
                                  webapp2.Route('/user/<id:\d{16}>', handler=GetUser, name='id'),
                                  webapp2.Route('/like/shout/<id:\d{16}>', handler=LikeShout, name='id'),
                                  webapp2.Route('/like/comment/<id:\d{16}>', handler=LikeComment, name='id'),
                                  webapp2.Route('/shout/<id:\d{16}>', handler=getShout, name='id'),
                                  ], debug=True, config=config)



logging.getLogger().setLevel(logging.DEBUG)
