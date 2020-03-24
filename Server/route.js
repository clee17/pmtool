var express = require('express'),
    path = require('path'),
    LZString = require('lz-string');

var department = require('./../data/model/department'),
    efforts = require('./../data/model/efforts'),
    location = require('./../data/model/location'),
    party = require('./../data/model/party'),
    product = require('./../data/model/product'),
    project = require('./../data/model/project'),
    user = require('./../data/model/user'),
    contacts = require('./../data/model/contacts');

let tableList = {
    "department":department,
    "efforts":efforts,
    "location":location,
    "party":party,
    "product":product,
    "project":project,
    "user":user,
    "contacts":contacts
};

let router = express.Router();

let basedir = path.join(path.resolve(__dirname),'../');

let handler = {
    index:function(req,res){
        res.render('index.html',{title:"欢迎界面"});
    },

    table:function(req,res,next){
        let tableId = req.params.tableId;
        let pageId = req.query.id;
        pageId--;
        if(pageId<0)
            next();
        if(!tableList[tableId])
            next();
        else
          res.render('table.html',{title:tableId});
    },

    count:function(req,res){}
};

router.get('/',handler.index);
router.get('/:tableId',handler.table);

router.post('/count/',handler.count);

module.exports = function(app){
    app.use('/lib',express.static(path.join(basedir,"/lib")));
    app.use('/js',express.static(path.join(basedir,"/js")));
    app.use('/',router);

    app.get('*', function(req, res){
        res.render('error.html', {
            title: '出错啦!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};

