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
    LZString = require('../public/lib/lz-string.min.js');


var efforts = require('./../data/model/efforts'),
    accountModel = require('../data/model/accounts'),
    paymentModel = require('../data/model/payment'),
    paymentDocModel = require('../data/model/paymentDocs'),
    collectionModel = require('../data/model/accounting_collection')
    productModel = require('./../data/model/product'),
    deliveryModel = require('./../data/model/delivery'),
    credentialModel = require('./../data/model/userCredential'),
    projectModel = require('./../data/model/project'),
    positionModel = require('./../data/model/position'),
    projectCommentModel = require('./../data/model/projectComment'),
    developerTaskModel = require('../data/model/developerTask'),
    developerLogModel = require('../data/model/developerLog'),
    userModel = require('./../data/model/user'),
    docModel = require('./../data/model/doc'),
    QAModel = require('./../data/model/QA'),
    versionModel = require('./../data/model/version'),
    versionTaskModel = require('./../data/model/versionTask'),
    contactsModel = require('./../data/model/contacts');

let tableList = {
    "efforts":efforts,
    "account":accountModel,
    "collection":collectionModel,
    "product":productModel,
    "project":projectModel,
    "developerTask":developerTaskModel,
    "developerLog":developerLogModel,
    "projectComment":projectCommentModel,
    "user":userModel,
    "contacts":contactsModel,
    "version":versionModel,
    "versionTask":versionTaskModel,
    "docs":docModel,
    "payment":paymentModel,
    "paymentDocs":paymentDocModel,
    'position':positionModel
};

let router = express.Router();

let basedir = path.join(path.resolve(__dirname),'../');
let dataDir = path.join(basedir,'data/');
let SETTING = fs.readFileSync(path.join(dataDir,'/setting.json'),'utf8');

var systemSetting = JSON.parse(SETTING);

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

    sendError:function(res,response,err){
        if(response.sent)
            return;
        response.sent = true;
        response.message = err;
        res.send(LZString.compressToBase64(JSON.stringify(response)));
    },

    checkOwner:function(req,res){
        let user = req.session.user;
        if(user.title !== 'Program Manager')
            return false;
    },

    index:function(req,res){
        if(!req.session.user){
            res.render('login.html', {});
        }else{
            handler.pm(req,res);
        }
    },

    pwdReset:function(req,res){
        res.render('pwd.html', {});
    },

    pm:function(req,res){
        if(!req.session.user){
            res.render('login.html',{});
            return;
        }
        let pageId = req.query.pid;
        if(!pageId)
            pageId = 1;
        pageId--;
        let render = {};
        render.contents = {};
        let search = {owner:req.session.user._id};
        if(req.session.user.title === 'CEO')
            search = {};
        search.status = {$in:[1,2,3,4,6]};
        projectModel.find(search,null,{sort:{schedule:1},limit:25,skip:pageId*25}).populate('account endCustomer contacts delivery suppliers owner').exec()
            .then(function(entries){
                render.contents.entries = entries;
                return projectModel.countDocuments(search).exec();
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
                render.user = req.session.user;
                res.render('projectManager.html',render);
            });
    },

    pmInfo:function(req,res){
        if(!req.session.user){
            res.render('login.html',{});
            return;
        }
        let id = req.query.id;
        if(!id || !id.match(/^[0-9a-fA-F]{24}$/)){
            res.render('projectInfo.html',{title:'未知的项目',header:'请输入有效的项目id'});
            return;
        }

        let render = {};
        projectModel.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(id)}},
            {$lookup:{from:'accountFTP',localField:'account',foreignField:'account',as:"FTP"}},
            {$unwind:{path: "$FTP", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'accountAddress',localField:'account',foreignField:'account',as:"address"}},
            {$unwind:{path: "$address", preserveNullAndEmptyArrays: true }},
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
                    render.contents = contents;
                    render.title = contents.name;
                    render.header = header;
                }
                return userModel.find({}).exec();
            })
            .then(function(users){
                render.users = users;
                render.setting = SETTING;
                render.user = req.session.user;
                res.render('projectInfo.html',render);
            })
            .catch(function(err){
                res.render('error.html',{title:'未知的项目',message:err});
            })

        
    },

    developer:function(){
        userModel.aggregate([
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
    },

    account:function(req,res){
        let pageId = req.query.pid;
        if(!pageId)
            pageId = 1;
        pageId--;
        let render = {};
        render.contents = {};
        accountModel.estimatedDocumentCount().exec()
            .then(function(count){
                render.contents.maxCount = count;
                return accountModel.aggregate([
                    {$match:{}},
                    {$sort:{name:1}},
                    {$skip:pageId*25},
                    {$limit:25},
                    {$lookup:{from:'accountAddress',localField:'_id',foreignField:'account',as:"address"}},
                    {$unwind:{path: "$address", preserveNullAndEmptyArrays: true }},
                    {$lookup:{from:'account',localField:'parent',foreignField:'_id',as:"parent"}},
                    {$unwind:{path: "$parent", preserveNullAndEmptyArrays: true }},
                ]).exec();
            })
            .then(function(entries){
                render.contents.entries = entries;
                res.render('accountManager.html',render);
            });
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

    QAManager:function(req,res){
        let pageId = req.query.pid;
        if(!pageId)
            pageId = 1;
        pageId--;
        let render = {};
        render.contents = {};
        QAModel.estimatedDocumentCount().exec()
            .then(function(count){
                render.contents.maxCount = count;
                return QAModel.find({},null,{sort:{name:1},limit:25,skip:pageId*25}).populate('').exec();
            })
            .then(function(entries){
                render.contents.entries = entries;
                res.render('QAManager.html',render);
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
        render.setting = {};
        docModel.find({},null,{limit:20,skip:pageId*20,  sort:{
                date: -1
            }}).populate('account project').exec()
            .then(function (docs) {
                render.entries = docs;
                return docModel.estimatedDocumentCount().exec();
            })
            .then(function(count){
                render.total = count;
                return accountModel.find({},null,{sort:{name:1}}).exec();
            })
            .then(function(accounts){
                render.accounts = accounts;
                render.setting = SETTING;
                res.render('docManager.html',render);
            })
            .catch(function (err) {
                console.log(err);
                render.err = err;
                render.title = err.message;
                render.message =err.message;
                res.render('error.html',render);
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

    deleteDoc:function(req,res) {

        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent: false,
            failedLink: [],
            message: "unknown failure"
        };

        let id = received._id;
        if(!handler.checkOwner(req)){
            handler.sendError(res,response,'you are not authorized to perform this action');
            return;
        }
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            handler.sendError(res, response, "no valid document id received");
            return;
        }

        docModel.findOne({_id: id}).exec()
            .then(function (doc) {
                 if (!doc) {
                    handler.sendError(res, response, 'no document found matching this id');
                } else {
                    let link = [];
                    link.push(doc.link);
                    if (doc.history) {
                        for (let i = 0; i < doc.history.length; ++i)
                            link.push(doc.history[i].link);
                    }
                    for (let i = 0; i < link.length; ++i) {
                        let path = systemSetting.DocLocalPath;
                        if (path.charAt(path.length - 1) !== '/')
                            path += '/';
                        try {
                            fs.unlinkSync(path + link[i])
                        } catch (e) {
                            console.log(e);
                            response.failedLink.push(link[i]);
                        }
                    }
                    return docModel.deleteOne({_id: id}).exec();
                }
            })
            .then(function (err, result) {
                if (!err && result) {
                    response.success = true;
                } else {
                    response.message = err ? err.message : 'failed due to unknown error';
                }
                handler.sendResult(res, response);
            })
            .catch(function (e) {
                response.success = false;
                response.message = e? e.message : 'failed due to unknown error';
                handler.sendResult(res,response);
            })
    },

    count:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            index:received.index,
            maxCount:0,
            message:"unknown failure"
        };

        let search = {};
        if(received.search)
            search = received.search;
        let tableId = received.index;
        if(!tableList[tableId]){
            response.message = 'no valid tableId received';
            response.success = false;
            handler.sendResult(res,response);
            return;
        }
        tableList[tableId].countDocuments(search,function(err,result){
            if(err){
                response.message = err.message;
                response.success = false;
                handler.sendResult(res,response);
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
        let receivedStr = LZString.decompressFromBase64(req.body.data);
        let received = null;
        let err = '';
        try{
            received = JSON.parse(unescape(receivedStr));
        }catch(err){
            err  = err.message;
        }

        let tableId = req.params.tableId;

        if(!tableList[tableId]){
            handler.renderError(res,'no valid tableId received');
            return;
        }else if(!received){
            handler.renderError(res,err);
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
            requestId:received.requestId,
            result:[],
            message:"unknown failure"
        };

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
        if(received.search)
            search = received.search;
        let update = received;
        if(received.updateExpr)
            update = received.updateExpr;
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

    delete:function(req,res){
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

        tableList[tableId].deleteMany(received.search,function(err,result){
            if(err){
                response.message = err.message;
                response.success = false;
                handler.sendResult(res,response);
            }else{
                response.maxCount = result;
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            }
        })
    },

    replaceUpload:function(req,res){
        let response = {
            sent:false,
            success:false,
            result: null,
            message:""
        };
        let files = req.files;
        if(req.files[0]) {
            let receivedStr = req.body.data;
            receivedStr = decodeURIComponent(req.body.data);
            let received = JSON.parse(LZString.decompressFromBase64(receivedStr));
            let search = received.search;
            let original = received.original;
            let link, originalLink;
            link = originalLink = original.link;
            let originalExt = link.substring(link.lastIndexOf('.'));
            let ext = files[0].originalname.substring(files[0].originalname.lastIndexOf('.'));
            if (originalExt !== ext) {
                link = link.substring(0, link.indexOf(originalExt)) + ext;
            }
            let path = systemSetting.DocLocalPath;
            if(path.charAt(path.length-1) !== '/')
                path += '/';
            fs.unlink(path+originalLink, function (err) {
                if (err) {
                    handler.sendError(res,response,err.message);
                } else {
                    fs.rename(files[0].path, link, function (err) {
                        if (err)
                            handler.sendError(res,response,err.message);
                        else {
                            if(link !== originalLink){
                                req.body.data = encodeURIComponent(LZString.compressToBase64(JSON.stringify(received)));
                                handler.save(req, res);
                            }else{
                                response.result  = {_id:received.search._id,link:link};
                                response.success =true;
                                handler.sendResult(res,response);
                            }
                        }
                    })
                }
            });
        }else{
            handler.sendError(res,response,'something went wrong when processing the file upload replacement');
        }
    },

    upload:function(req,res){
        let files = req.files;
        if(req.files[0]){
            let receivedStr = req.body.data;
            receivedStr = decodeURIComponent(req.body.data);
            let received =JSON.parse(LZString.decompressFromBase64(receivedStr));
            let type = req.body.type || received.type || received.search.type || 10;
            if(typeof type !== 'number')
                type = Number(type);
			let project = received.project || null;
            let prefixList = ['Legal','Legal','Legal','Finance','Finance','Reference','Finance','','','','Release'];
            let typeList = ['NDA','SOW','SLA','Royalty','invoice','reference','receipt','','','',''];
            let prefix = prefixList[type] || '';
            let typeIndicator = typeList[type] || '';
            if(typeIndicator.length >0)
                typeIndicator += '_';
            let ext = files[0].originalname.substring(files[0].originalname.lastIndexOf('.'));
            let filename = req.body.filename? req.body.filename : files[0].filename;
            let date = Date.now();
             date = new Date(date);
             let year = date.getFullYear();
             let month = date.getMonth();
             let day = date.getDate();
             let hour = date.getHours();
             let min = date.getMinutes();
             let secs=  date.getSeconds();
             let timeStamp = year.toString()+month.toString()+day.toString()+hour.toString()+min.toString()+secs.toString();
            let newLink  =  typeIndicator+timeStamp+'_'+filename+ ext;
            let path = systemSetting.DocLocalPath;
            if(path.charAt(path.length-1) !== '/')
                path += '/';
            let search = received.search || received;
            let projectLink = search.project? "projects/"+search.project : 'accounts/'+search.account;
            projectLink += '/';
            if (!fs.existsSync(path+projectLink+prefix)){
                fs.mkdirSync(path+projectLink+prefix,{recursive:true});
            };
            if (prefix !== '')
                prefix += '/';
            fs.rename(files[0].path,path+projectLink+prefix+newLink,function(err){
                let updateLink = "";
                if(err){
                    fs.unlink(files[0].path,function(err){
                    });
                    throw Error(err.message);
                }else{
                    updateLink = projectLink+prefix+newLink;
                }
                if(received.updateExpr)
                    received.updateExpr.link = updateLink;
                else if(received.search)
                    received.search.link = updateLink;
                else
                    received.link = updateLink;
				if(received.search && type <10)
					received.search.type = type;
				else if(type <10)
					received.type = type;
                req.body.data = encodeURIComponent(LZString.compressToBase64(JSON.stringify(received)));
                handler.save(req,res);
            });
        }else
            throw Error('something went wrong when processing the file upload');
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

    accounting:function(req,res){
        let page = req.params.page;
        let limited = ['collection','payment'];
        if(page && limited.indexOf(page)<0){
            handler.renderError(res,'no such page');
            return;
        }
        if(!req.session.user){
            res.render('login.html', {});
        }else{
            res.render('accounting', {pageId:page,user:req.session.user});
        }
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
    },

    login:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            userInfo:null,
            message:"unknown failure"
        };

        userModel.findOne({name:received.username}).exec()
            .then(function(account){
                if(!account){
                    throw 'no such user found';
                }else
                {
                    response.userInfo = account;
                    return credentialModel.findOne({user:account._id}).exec();
                }
            })
            .then(function(credential){
                if(credential && credential.pwd  === received.cre){
                    response.success = true;
                    req.session.user = response.userInfo;
                }else if(!credential){
                    response.message = "you need to set your password before your first login.";
                }else{
                    response.message = "your password is incorrect!";
                }
                handler.sendResult(res,response);
            })
            .catch(function(err){
                response.message = err;
                handler.sendResult(res,response);
            })
    },

    logout:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            userInfo:null,
            message:"unknown failure"
        };

        if(req.session.user && req.session.user._id === received._id){
            response.success = true;
            req.session.user = null;
            handler.sendResult(res,response);
        }else if(!req.session.user){
            response.message = "The user has logged out already."
            handler.sendResult(res,response);
        }else if(req.session.user && req.session.user._id !== received._id){
            response.message = "You cannot logout for someone else."
            handler.sendResult(res,response);
        }
    },


    pwd:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent:false,
            message:"unknown failure"
        };

        credentialModel.findOne({user:received.user}).exec()
            .then(function(result){
                if(!result)
                    return credentialModel.findOneAndUpdate({user:received.user},
                        {pwd:received.pwd},
                        {upsert:true,setDefaultsOnInsert:true,new:true}).exec();
                else
                    throw ' Your password has been set already, please contact admin if you needs to reset it.'
            })
            .then(function(update){
                if(!update)
                    throw ' something is wrong';
                else{
                    response.success = true;
                    response.message = 'your password has been successfully reset';
                    handler.sendResult(res,response);
                }
            })
            .catch(function(err){
                response.success = false;
                response.message = typeof err != 'string' ? JSON.stringify(err):err;
                handler.sendResult(res,response);
            });
    },

    fileserver:function(req,res){
        let url = req.originalUrl;
        if(systemSetting.OS === "windows"){
           url = url.replace(/\//g,"\\");
            url = "\\"+url;
        }else {
            url = url.replace(/\\/g,"/");
            url = url.replace(/\/\//g,"/");
            url = systemSetting.fileServerPath + url;
        }

        url = decodeURI(url);
        fs.access(url,(err)=>{
            if(err){
                handler.renderError(res,err);
            }else{
                res.sendFile(url);
            }
        });
    }
};

router.get('/',handler.index);
router.get('/pwdSet',handler.pwdReset);
router.get('/project/info',handler.pmInfo);
router.get('/developer',handler.developer);
router.get('/account',handler.account);
router.get('/tutorial',handler.tutorial);
router.get('/tutorial/:contentId',handler.tutorial);
router.get('/QAManager',handler.QAManager);
router.get('/QATool',handler.QA);
router.get('/QATool/:contentId',handler.QA);
router.get('/Accounting',handler.accounting);
router.get('/Accounting/:page',handler.accounting);
router.get('/doc',handler.docManager);
router.get('/doc/:projectId/:docId',handler.doc);
router.get('/fileserver/*',handler.fileserver)

router.post('/countInfo/',handler.count);
router.post('/vagueSearch/',handler.vague);
router.post('/search/:tableId',handler.search);
router.post('/aggregate/:tableId',handler.aggregate);
router.post('/save/:tableId',handler.save);
router.post('/delete/:tableId',handler.delete);
router.post('/upload/:tableId',handler.upload);
router.post('/deleteDoc/',handler.deleteDoc);
router.post('/replaceUpload/:tableId',handler.replaceUpload);
router.post('/getInfo/developers',handler.developers);
router.post('/getInfo/products',handler.products);
router.post('/login/',handler.login);
router.post('/logout/',handler.logout);
router.post('/pwdReset/',handler.pwd);


module.exports = function(app){
    let objMulter = multer({dest:systemSetting.DocLocalPath});
    app.use('/lib',express.static(path.join(basedir,"/public/lib")));
    app.use('/js',express.static(path.join(basedir,"/public/js")));
    app.use('/css',express.static(path.join(basedir,"/public/css")));
    app.use('/img',express.static(path.join(basedir,"/public/img")));
    app.use('/assets',express.static(systemSetting.DocLocalPath));
    app.use('/fontawesome',express.static(path.join(basedir,"/public/fontawesome")));

    app.use(objMulter.any());
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
        res.status(404);
        res.render('error.html', {
            title: 'Error not found!',
            message:'对不起，我们没有找到该网页。<br>该网页或许尚在施工中，敬请期待。'
        })
    });
};