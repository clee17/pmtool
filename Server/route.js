var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    LZString = require('lz-string');

var efforts = require('./../data/model/efforts'),
    account = require('../data/model/accounts'),
    productModel = require('./../data/model/product'),
    project = require('./../data/model/project'),
    userModel = require('./../data/model/user'),
    contacts = require('./../data/model/contacts');

let tableList = {
    "efforts":efforts,
    "account":account,
    "product":productModel,
    "project":project,
    "user":userModel,
    "contacts":contacts
};

let router = express.Router();

let basedir = path.join(path.resolve(__dirname),'../');

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
        let pageId = req.query.pid || 1;
        pageId--;
        if(pageId<0)
            handler.renderError(res,"错误页码");
        project.find({},null,{skip:30*pageId,limit:30},function(err,docs){
            try{
                let header =  fs.readFileSync(path.join(basedir,'/template/project.html'));
                let contentTemplate = fs.readFileSync(path.join(basedir,'/template/projectInfo.html'));
                let addTemplate = "";
                let contents = [];
                if(err)
                    throw new Error(JSON.stringify(err));
                else{
                    contents = JSON.parse(JSON.stringify(docs));
                    for(let i=0; i<contents.length;++i){
                        delete contents[i]._id;
                    }
                }
                res.render('dashboard.html',{headline:header,contents:contents});
            }catch(e){
                handler.renderError(res,JSON.stringify(e));
            }
        });


    },

    table:function(req,res,next){
        let tableId = req.params.tableId;
        let pageId = req.query.pid || 1;
        pageId--;
        if(pageId<0)
            handler.renderError(res,"错误页码");
        if(!tableId)
            handler.renderError(res,"请输入正确的网址");
        if(!tableList[tableId]){
            next();
            return;
        }

        tableList[tableId].find({},null,{skip:30*pageId,limit:30},function(err,docs){
            try{
                let contents = [];
                if(err)
                    throw new Error(JSON.stringify(err));
                else{
                    contents = JSON.parse(JSON.stringify(docs));
                    for(let i=0; i<contents.length;++i){
                        delete contents[i]._id;
                    }
                }
                let headLink = fs.readFileSync(path.join(basedir,'/template/'+tableId+'.html'));
                let addTemplate = fs.readFileSync(path.join(basedir,'/template/'+tableId+'Add.html'));
                let contentTemplate = fs.readFileSync(path.join(basedir,'/template/'+tableId+'Info.html'));
                res.render('index.html',
                    {title:tableId,
                        headline:headLink,
                        add:addTemplate,
                        contents:contents,
                        tableId:tableId,
                        contentTemplate:contentTemplate});
            }catch(e){
                handler.renderError(res,JSON.stringify(e));
            }
        }).populate('company');
    },

    tutorial:function(req,res){
        let contentId = req.params.contentId;
        try{
            if(!contentId || contentId === '')
                contentId = 'preface';
            contentId = contentId.toLowerCase();
           let contents =  fs.readFileSync(path.join(basedir,'/view/tutorial/'+contentId+'.html'));
            res.render('tutorial.html',{title:"PM教程",contents:contents});
        }catch(e){
            res.render('tutorial.html',{title:"PM教程",contents:e});
        }

    },

    count:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            index:received.index,
            maxCount:0,
            message:"unknown failure"
        };

        let tableId = received.index;
        if(!tableList[tableId]){
            handler.renderError(res,'no valid tableId received');
            return;
        }
        tableList[tableId].countDocuments({},function(err,result){
            if(err){
                handler.renderError(res,JSON.stringify(err));
            }else{
                response.maxCount = result;
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            }
        })
    },

    vague:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            index:received.index,
            result:[],
            message:"unknown failure"
        };

        let tableId = received.index;
        if(!tableList[tableId]){
            handler.renderError(res,'no valid tableId received');
            return;
        }

        if(received.value.length === 0){
            response.success = true;
            handler.sendResult(res,response);
        }
        let reg = new RegExp(received.value,'i');
        tableList[tableId].find({name:{$regex:reg}},function(err,docs){
            if(err){
                handler.renderError(res,JSON.stringify(err));
            }else{
                response.result = JSON.parse(JSON.stringify(docs));
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            }
        })
    },

    developers:function(req,res){
        let data = {
            sent:false,
            index:"developers",
            message:'',
            result:null,
            success:false
        };
        let development = ["R&D 1","R&D 2","Q&A"];
        userModel.find({department:{$in:development}},function(err,doc){
            if(err){
                data.message= JSON.stringify(err);
            }
            else{
                data.success = true;
                data.result = JSON.parse(JSON.stringify(doc));
                handler.sendResult(res,data);
            }
        });
    },

    products:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            index:received.index,
            maxCount:0,
            message:"unknown failure"
        };
        let condition = received.condition || {};
        tableList['product'].find(condition,function(err,docs){
            if(err){
                response.message= JSON.stringify(err);
                handler.sendResult(res,response);
            }
            else{
                response.success = true;
                response.result = JSON.parse(JSON.stringify(docs));
                handler.sendResult(res,response);
            }
        });
    }

};

router.get('/',handler.index);
router.get('/:tableId',handler.table);
router.get('/tutorial',handler.tutorial);
router.get('/tutorial/:contentId',handler.tutorial);
router.post('/countInfo/',handler.count);
router.post('/vagueSearch/',handler.vague);
router.post('/getInfo/developers',handler.developers);
router.post('/getInfo/products',handler.products);


module.exports = function(app){
    app.use('/lib',express.static(path.join(basedir,"/public/lib")));
    app.use('/js',express.static(path.join(basedir,"/public/js")));
    app.use('/css',express.static(path.join(basedir,"/public/css")));
    app.use('/img',express.static(path.join(basedir,"/public/img")));
    app.use('/fontawesome',express.static(path.join(basedir,"/public/fontawesome")));
    app.use('/',router);

    app.get('*', function(req, res){
        res.render('error.html', {
            title: '出错啦!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};

