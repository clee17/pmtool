var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    ejs = require('ejs'),
    mongoose= require('mongoose'),
    LZString = require('lz-string');

var efforts = require('./../data/model/efforts'),
    accountModel = require('../data/model/accounts'),
    paymentModel = require('../data/model/payment'),
    paymentDocModel = require('../data/model/paymentDocs'),
    productModel = require('./../data/model/product'),
    deliveryModel = require('./../data/model/delivery'),
    projectModel = require('./../data/model/project'),
    projectCommentModel = require('./../data/model/projectComment'),
    projectTaskModel = require('./../data/model/projectTask'),
    userModel = require('./../data/model/user'),
    docModel = require('./../data/model/doc'),
    versionModel = require('./../data/model/version'),
    versionTaskModel = require('./../data/model/versionTask'),
    contactsModel = require('./../data/model/contacts');

let tableList = {
    "efforts":efforts,
    "account":accountModel,
    "product":productModel,
    "project":projectModel,
    "projectTask":projectTaskModel,
    "projectComment":projectCommentModel,
    "user":userModel,
    "contacts":contactsModel,
    "version":versionModel,
    "versionTask":versionTaskModel,
    "docs":docModel,
    "payment":paymentModel,
    "paymentDocs":paymentDocModel

};

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

    pm:function(req,res){
        let pageId = req.query.pid;
        if(!pageId)
            pageId = 1;
        pageId--;
        let render = {};
        render.contents = {};
        projectModel.find({},null,{sort:{schedule:1},limit:25,skip:pageId*25}).populate('account endCustomer contacts delivery suppliers').exec()
            .then(function(entries){
                render.contents.entries = entries;
                return projectModel.estimatedDocumentCount({}).exec();
            })
            .then(function(count){
                render.contents.maxCount = count;
                return accountModel.find({},null,{sort:{name:1}}).exec();
            })
            .then(function(accounts){
                render.accounts = accounts;
                return accountModel.find({type:1},null,{sort:{name:1}}).exec();
            })
            .then(function(ECMs){
                render.ECMs = ECMs;
                render.title = 'PM';
                res.render('projectManager.html',render);
            });
    },

    pmInfo:function(req,res){
        let id = req.query.id;
        if(!id || !id.match(/^[0-9a-fA-F]{24}$/)){
            res.render('projectInfo.html',{title:'未知的项目',header:'请输入有效的项目id'});
            return;
        }

        let render = {};
        projectModel.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(id)}},
            {$lookup:{from:'account',localField:'account',foreignField:"_id",as:"account"}},
            {$unwind:{path: "$account", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'contacts',localField:'account._id',foreignField:"company",as:"contacts"}},
            {$lookup:{  from: "projectContact",
                    let: {projectId: "$_id"},
                    pipeline: [
                        {$match:{$expr:{$eq:["$$projectId","$project"]}}},
                        {$sort:{priority:-1}},
                        {$lookup:{from:'contacts',localField:'contact',foreignField:"_id",as:"contact"}},
                        {$unwind:"$contact"},
                        {$replaceRoot:{newRoot:"$contact"}},
                    ],
                    as: "projectContacts"}},
            {$lookup:{from:'delivery',localField:'delivery',foreignField:"_id",as:"delivery"}},
            {$unwind:{path: "$delivery", preserveNullAndEmptyArrays: true }},
        ])
            .then(function(docs){
                if(docs.length === 0)
                    throw '数据库中没有该项目';
                else{
                    let contents = JSON.parse(JSON.stringify(docs[0]));
                    let accountLink = contents.account? '<a target="_blank" href="/account/info?id='+contents.account._id+'">'+contents.account.name + '</a>' : 'CIDANA';
                    accountLink += '&nbsp&nbsp-&nbsp&nbsp';
                    let deliveryLink = contents.delivery? contents.delivery.name: 'Product Not Defined';
                    let header = accountLink+ contents.name+ '&nbsp&nbsp-&nbsp&nbsp' + deliveryLink;
                    console.log(contents._id);
                    console.log(contents.projectContacts);
                    render.contents = contents;
                    render.title = contents.name;
                    render.header = header;
                }
                return userModel.find({}).exec();
            })
            .then(function(users){
                render.users = users;
                let settings =  fs.readFileSync(path.join(dataDir,'/setting.json'),'utf8');
                render.setting = settings;
                res.render('projectInfo.html',render);
            })
            .catch(function(err){
                res.render('error.html',{title:'未知的项目',message:err});
            })

        
    },

    tutorial:function(req,res){
        let contentId = req.params.contentId;
        userModel.find({}).exec()
            .then(function(contacts){
                if(!contentId || contentId === '')
                    contentId = 'preface';
                contentId = contentId.toLowerCase();
                let contents =  fs.readFileSync(path.join(basedir,'/view/tutorial/'+contentId+'.html'),'utf-8');
                contents = ejs.render(contents,{cidanaContact:JSON.parse(JSON.stringify(contacts))});
                res.render('tutorial.html',{title:"PM教程",contents:contents});
            })
            .catch(function(err){
                res.render('tutorial.html',{title:"PM教程",contents:err});
            });
    },

    QA:function(req,res){
        let contentId = req.params.contentId;
        if(!contentId || contentId === '')
            contentId = 'preface';
        contentId = contentId.toLowerCase();
        try{
            let contents =  fs.readFileSync(path.join(basedir,'/view/QA/'+contentId+'.html'),'utf-8');
            res.render('QACheck.html',{title:"PM教程",contents:contents});
        }catch(err){
            res.render('QACheck.html',{title:"PM教程",contents:err});
        }
    },

    docManager:function(req,res,next) {
        let pageId = req.query.pid;
        let render = {};
        if(!pageId)
            pageId = 1;
        pageId--;
        render.pageId=  pageId;
        render.setting ={};
        docModel.find({},null,{limit:20,skip:pageId*20,  sort:{
                date: -1
            }}).populate('account project').exec()
            .then(function (docs) {
                render.entries = docs;
                return docModel.estimatedDocumentCount().exec();
            })
            .then(function(count){
                render.total = count;
                return accountModel.find({}).exec();
            })
            .then(function(accounts){
                render.accounts = accounts;
                let settings =  fs.readFileSync(path.join(dataDir,'/setting.json'),'utf8');
                render.setting = settings;
                res.render('docManager.html',render);
            })
            .catch(function (err) {
                render.err = err;
                res.render('docManager.html',render);
            });
    },

    doc:function(req,res,next){
        let docId = req.params.docId;
        userModel.find({}).exec()
            .then(function(contacts){
                if(!docId || docId === '')
                    next();
                let contents =  fs.readFileSync(path.join(basedir,'/view/doc/'+docId+'.html'),'utf-8');
                contents = ejs.render(contents,{cidanaContact:JSON.parse(JSON.stringify(contacts))});
                res.render('doc.html',{title:"cidana文档",contents:contents});
            })
            .catch(function(err){
                res.render('doc.html',{title:"cidana文档",contents:err});
            });
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

    aggregate:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let tableId = req.params.tableId;

        let response = {
            sent:false,
            index:tableId,
            result:[],
            message:""
        };

        if(!tableList[tableId]){
           response.message = 'no valid tableId received';
            return;
        }else if(!received || !Array.isArray(received)){
            response.message = 'no valid aggregate list received';
            return;
        }

        if(response.message !== ""){
            handler.sendResult(res,response);
            return;
        }

        for(let i=0;i<received.length;++i){
            for(let attr in received[i]){
                for(let index in received[i][attr]){
                    let content = received[i][attr][index];
                    if(typeof content === 'object' && content.type === 'ObjectId'){
                        received[i][attr][index] = mongoose.Types.ObjectId(content.value);
                    }
                }
            }
        }

        tableList[tableId].aggregate(received)
            .then(function(docs){
                response.result = docs;
                response.success = true;
                handler.sendResult(res,response);
            })
            .catch(function(err){
                if(typeof err != 'string')
                    err = JSON.stringify(err);
                response.message = err;
                handler.sendResult(res,response);
            });
    },

    search:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let tableId = req.params.tableId;

        if(!tableList[tableId]){
            handler.renderError(res,'no valid tableId received');
            return;
        }
        let search = {};
        let cond = null;
        search = received.search? received.search : received;
        if(received.cond)
            cond = received.cond;
        let populate = '';
        if(received.populate)
            populate = received.populate;
        let response = {
            sent:false,
            index:tableId,
            result:[],
            message:"unknown failure"
        };

        for(let attr in search){
            if(!(typeof search[attr] == 'object'))
                continue;
            for(let index in search[attr]){
                if(index == "$regex"){
                    search[attr][index] = new RegExp(search[attr][index].value, search[attr][index].cond);
                }
            }
        }

        tableList[tableId].countDocuments(search).exec()
            .then(function(count){
                response.count = count;
                return tableList[tableId].find(search,null,cond).populate(populate).exec();
            })
            .then(function(docs){
                response.result = JSON.parse(JSON.stringify(docs));
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            })
            .catch(function(err){
                console.log(err);
                response.message = JSON.stringify(err);
                handler.sendResult(res,response);
            })
    },

    save:function(req,res){
        let receivedStr = req.body.data;
        receivedStr = decodeURIComponent(req.body.data);
        let received =JSON.parse(LZString.decompressFromBase64(receivedStr));
        let tableId = req.params.tableId;
        if(!tableList[tableId]){
            handler.renderError(res,'no valid tableId received');
            return;
        }
        let response = {
            sent:false,
            index:tableId,
            result:[],
            message:"unknown failure"
        };

        let populate = '';
        let search = received._id? {_id:received._id} : received;
        let update = received;
        if(update._id)
            delete update._id;
        if(update.populate){
            populate = update.populate;
            delete update.populate;
        }

        tableList[tableId].findOneAndUpdate(search,update,{upsert:true,setDefaultsOnInsert:true,new:true},function(err,result){
            if(err){
                response.message = typeof err != 'string' ? JSON.stringify(err):err;
                handler.sendResult(res,response);
            }else{
                response.result = JSON.parse(JSON.stringify(result));
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            }
        }).populate(populate);
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

router.get('/',handler.pm);
router.get('/project/info',handler.pmInfo);
router.get('/tutorial',handler.tutorial);
router.get('/tutorial/:contentId',handler.tutorial);
router.get('/QATool',handler.QA);
router.get('/QATool/:contentId',handler.QA);
router.get('/doc',handler.docManager);
router.get('/doc/:projectId/:docId',handler.doc);

router.post('/countInfo/',handler.count);
router.post('/vagueSearch/',handler.vague);
router.post('/search/:tableId',handler.search);
router.post('/aggregate/:tableId',handler.aggregate);
router.post('/save/:tableId',handler.save);
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

