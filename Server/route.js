var express = require('express'),
    path = require('path');

var department = require('./../data/model/department'),
    efforts = require('./../data/model/efforts'),
    location = require('./../data/model/location'),
    party = require('./../data/model/party'),
    product = require('./../data/model/product'),
    project = require('./../data/model/project'),
    user = require('./../data/model/user');

let router = express.Router();

let handler = {
    index:function(req,res){
        res.render('index.html',{title:"欢迎界面"});
    }
};

router.get('/',handler.index);

module.exports = function(app)
{
    app.use('/',router);

    app.get('*', function(req, res){
        res.render('error.html', {
            title: '出错啦!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};

