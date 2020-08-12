var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    ejs = require('ejs'),
    cookie = require('cookie-parser'),
    session = require('express-session'),
    multer = require('multer'),
    redis = require('redis'),
    redisStore = require('connect-redis')(session),
    redisClient  = redis.createClient('6379', '127.0.0.1'),
    mongoose= require('mongoose'),
    LZString = require('lz-string');

let router = express.Router();

let basedir = path.join(path.resolve(__dirname),'../');
let dataDir = path.join(basedir,'data/');


let handler = {
    renderError:function(res,message){
        res.render('error.html',{title:"错误信息",message:message});
    },

    sendResult:function(res,data){
        if(data.sent)
            return;
        if(!data)
            return;
        data.sent = true;
        res.send(LZString.compressToBase64(JSON.stringify(data)));
    },

    index:function(req,res){
        let pageId = req.params.pageId;
        if(pageId)
            res.render(pageId+'.html',{});
        else
            res.render('index.html', {});
    }
};

router.get('/manual/',handler.index);
router.get('/manual/:pageId',handler.index);

module.exports = function(app){
    app.use('/lib',express.static(path.join(basedir,"/public/lib")));
    app.use('/js',express.static(path.join(basedir,"/public/js")));
    app.use('/css',express.static(path.join(basedir,"/public/css")));
    app.use('/img',express.static(path.join(basedir,"/public/img")));
    app.use('/fontawesome',express.static(path.join(basedir,"/public/fontawesome")));

    app.use(cookie());

    redisClient.on("error",function(error){
         console.log(error);
    });

    app.use(session({
        secret:'a;ejbgda',
        resave: false,
        store: new redisStore({ host:'127.0.0.1',port:'6379',db: 0, pass: '',client:redisClient}),
        cookie: {
            secure: false,
            path:'/',
            httpOnly:true,
            maxAge:null
        }
    }));

    app.use('/',router);

    app.get('*', function(req, res){
        res.render('error.html', {
            title: '出错啦!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};

