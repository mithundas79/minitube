/**
 * Module dependencies.
 */

var express = require('express')
  , jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')
  , http = require('http')
  , path = require('path')
;

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  //Tell the request that we want to fetch youtube.com, send the results to a callback function
  request({uri: 'http://youtube.com'}, function(err, response, body){
    var self = this;
    self.items = new Array();//I feel like I want to save my results in an array

    //Just a basic error check
    if(err && response.statusCode !== 200){console.log('Request error.');}
    //Send the body param as the HTML code we will parse in jsdom
    //also tell jsdom to attach jQuery in the scripts and loaded from jQuery.com
    jsdom.env({
      html: body,
      scripts: ['http://code.jquery.com/jquery-1.10.2.min.js'],
      done: function(err, window){
        //Use jQuery just as in a regular HTML page
        var $ = window.jQuery;
        var $body = $('body');
        var $videos = $body.find('.context-data-item');

        $videos.each( function(i, item) {
          var $anchor = $(item).children('a.ux-thumb-wrap');
          var $innerSpan = $anchor.find('span.yt-thumb-default'); //thumbnail inner span
          var $imgSpan = $innerSpan.find('span.yt-thumb-clip'); //image span
          var $img = $imgSpan.find('img'); //image
          var $thumb = $img.attr('data-thumb') ? $img.attr('data-thumb') : $img.attr('src');
          self.items[i] = {
            time:   $(item).attr('data-context-item-time'),
            type:   $(item).attr('data-context-item-type'),
            id:     $(item).attr('data-context-item-id'),
            views:  $(item).attr('data-context-item-views'),
            title:  $(item).attr('data-context-item-title'),
            user:   $(item).attr('data-context-item-user'),
            thumbnail: $thumb
          };
        });

        console.log( self.items );
        res.render('index', {
            title: 'Mini Tube',
            items: self.items
         });
      }
    });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});