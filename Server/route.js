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
    attachModel = require('./../data/model/docAttach'),
    QAModel = require('./../data/model/QA'),
    versionModel = require('./../data/model/version'),
    versionTaskModel = require('./../data/model/versionTask'),
    contactsModel = require('./../data/model/contacts'),
    taskModel = require('./../data/model/tasks'),
    taskCommentModel = require('./../data/model/taskComment');


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
    'position':positionModel,
    "tasks":taskModel,
    "taskComment":taskCommentModel
};

let router = express.Router();

let basedir = path.join(path.resolve(__dirname),'../');
let dataDir = path.join(basedir,'data/');
let SETTING = fs.readFileSync(path.join(dataDir,'/setting.json'),'utf8');

var systemSetting = JSON.parse(SETTING);

var systemPath = systemSetting.DocLocalPath;
if(systemPath.charAt(systemPath.length-1) !== '/')
    systemPath += '/';
if (!fs.existsSync(systemPath+'attachments/')){
    fs.mkdirSync(systemPath+'attachments/',{recursive:true});
};

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
        if(typeof err != 'string')
            err = JSON.stringify(err);
        response.message = err;
        res.send(LZString.compressToBase64(JSON.stringify(response)));
    },

    checkOwner:function(req,res){
        let user = req.session.user;
        return user.title === 'Program Manager';
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

    pmReport:function(req,res){
        if(!req.session.user){
            res.render('login.html',{});
            return;
        }
        let id = req.query.id;
        if(!id || !id.match(/^[0-9a-fA-F]{24}$/)){
            res.render('projectReport.html',{title:'未知的项目',header:'请输入有效的项目id',errInfo:"",account:""});
            return;
        }

        projectModel.findOne({_id:id}).populate('account').exec()
            .then(function(result){
                if(!result)
                    throw "no valid project found";
                else{
                    let render = {};
                    render.project = JSON.parse(JSON.stringify(result));
                    render.title = result.name;
                    render.header = result.name;
                    render.errInfo = "";
                    render.account = result.account? result.account.name: "";
                    render.user = req.session.user;
                    render.setting = SETTING;
                    res.render('projectReport.html',render);
                }

            })
            .catch(function(err){
                console.log(err);
                res.render('projectReport.html',{title:'unknown project',header:'unknown project',errInfo:err,account:""});
            })
    },

    effort:function(req,res){
        let render = {};
        if(!req.session.user){
            res.render('login.html', {});
        }else{
            render.user = req.session.user;
            res.render('effortInfo.html',render);
        }
    },

    hrsByEng:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        if(!received.maxTime)
            received.maxTime = 0;
        else if(!received.minTime)
            received.minTime = 0;


        let response = {
            success:false,
            result:null,
            message:""
        }

        if(received.minTime === received.maxTime && received.minTime ===0){
            response.message = "timestamp missing";
            handler.sendResult(res,response);
            return;
        }else if(!received.eng){
            response.message = "englist missing";
            handler.sendResult(res,response);
            return;
        }

        let eng = received.eng;
        for(let i=0; i<eng.length;++i){
            eng[i] = mongoose.Types.ObjectId(eng[i]);
        }

        taskCommentModel.aggregate([
            {$match:{date:{$lte:new Date(received.maxTime),$gte:new Date(received.minTime)},type:{$gte:10,$lte:20},user:{$in:eng}}},
            {$group:{_id:{"task":"$task",user:"$user",year:{$year:{date:"$date"}},day:{$dayOfYear:{date:"$date"}}},"hours":{$sum:"$hours"}}},
            {$set:{"_id.hours":"$hours"}},
            {$replaceRoot:{newRoot: "$_id"}},
            {$lookup:{from:'tasks',localField:'task',foreignField:"_id",as:"task"}},
            {$unwind:{path: "$task", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'project',localField:"task.project",foreignField:"_id",as:"project"}},
            {$unwind:{path: "$project", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'account',localField:"project.account",foreignField:"_id",as:"project.account"}},
            {$unwind:{path: "$project.account", preserveNullAndEmptyArrays: true }},
        ])
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

    taskManager:function(req,res){
        let page = req.params.page;
        if(!req.session.user){
            res.render('login.html', {});
        }else{
            res.render('taskManager', {user:req.session.user});
        }
    },


    taskInfo:function(req,res){
        if(!req.session.user){
            res.render('login.html',{});
            return;
        }
        let id = req.query.id;
        if(!id || !id.match(/^[0-9a-fA-F]{24}$/)){
            res.render('taskInfo.html',{title:'未知的项目',header:'请输入有效的项目id'});
            return;
        }

        taskModel.findOne({_id:id}).populate('submitter').exec()
            .then(function (task) {
                task.user =  req.session.user;
                res.render('taskInfo.html',task);
            })
            .catch(function(err){
                res.render('error.html',{title:"错误信息",message:JSON.stringify(err)});
            })
    },

    taskComment:function(req,res){
        if(!req.session.user){
            res.render('login.html',{});
            return;
        }
        let id = req.query.id;
        if(!id || !id.match(/^[0-9a-fA-F]{24}$/)){
            res.render('taskInfo.html',{title:'未知的项目',header:'请输入有效的项目id'});
            return;
        }

        taskModel.findOne({_id:id}).populate('submitter').exec()
            .then(function (task) {
                task.user =  req.session.user;
                res.render('taskInfo.html',task);
            })
            .catch(function(err){
                res.render('error.html',{title:"错误信息",message:JSON.stringify(err)});
            })
    },

    updateTaskProgress:function(req,res){
        let received = JSON.parse(LZString.decompressFromBase64(req.body.data));
        let response = {
            sent: false,
            failedLink: [],
            message: "unknown failure"
        };
        let id = received._id;

        if(!req.session.user){
            handler.sendError(res,response,'you are not authorized to perform this action');
            return;
        }

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            handler.sendError(res, response, "no valid document id received");
            return;
        }

        let fail = function(errMessage){
            handler.sendError(res,response,errMessage);
        }

        let success = function(result){
            response.message = 'progress updated';
            response.success = true;
            response._id = result._id;
            response.progress = result.progress;
            handler.sendResult(res,response);
        }

        handler.traceTaskProgress(id,success,fail);
    },

    traceTaskProgress:function(id,success,fail){
        taskModel.findOne({_id:id}).populate([{ path: 'parent', select: {'progress': 1,'_id': 1}},{path:'children', select:{'_id':1,'progress':1}}]).exec()
            .then(function(task){
                let children = task.children;
                let subProgress = 0;
                if(children && children.length>0){
                    for(let i=0;i<children.length;++i){
                        subProgress += children[i].progress || 0;
                    }
                    subProgress = subProgress*100/(children.length * 100);
                }
                return taskModel.findOneAndUpdate({_id:id},{progress:subProgress},{upsert:false,new:true}).exec();
            })
            .then(function(result){
                if(success)
                    success(result);
                for(let i=0; i< result.parent.length;++i){
                    handler.traceTaskProgress(result.parent[i]._id,null,fail);
                }
            })
            .catch(function(err){
                if(fail)
                   fail(err.message || JSON.stringify(err));
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

    deleteTaskComment:function(req,res){
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
            handler.sendError(res, response, "no valid task id received");
            return;
        }


        taskCommentModel.findOne({_id:id}).exec()
            .then(function(result){
                if(!result)
                    throw "no such task found";
                else{
                    response.result = JSON.parse(JSON.stringify(result));
                    return taskCommentModel.deleteOne({_id:id}).exec();
                }
            })
            .then(function (result) {
                if (result) {
                    if(!response.result.hours)
                        response.result.hours = 0;
                    console.log(response.result);
                    return taskModel.findOneAndUpdate({_id:response.result.task},{$inc:{hours:0-response.result.hours}},{new:true}).exec();
                } else {
                    response.message = err ? err.message : 'failed due to unknown error';
                }
            })
            .then(function(result) {
                response.success = true;
                response.newHrs=  result.hours;
                handler.sendResult(res,response);

            })
            .catch(function(err){
                response.success = false;
                handler.sendError(res,response,err.message || err);
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
                console.log(err);
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

    saveTask:function(req,res,next){
        let receivedStr = decodeURIComponent(req.body.data);
        let received =JSON.parse(LZString.decompressFromBase64(receivedStr));

        let response = {
            sent:false,
            index:"newTask",
            info:received.info || null,
            result:[],
            message:"unknown failure"}

        if(!received.title || !received.description){
            handler.sendError(res,response,"missing title or description");
            return;
        }

        let model = new taskModel();
        let keys = Object.keys(received);
        for(let i=0;i<keys.length;++i){
            model[keys[i]] = received[keys[i]];
        }

        model.submitter = req.session.user._id;


        model.save()
            .then(function(doc){
                response.result = doc;
                response.success = true;
                if(received.parent)
                    return taskModel.findOneAndUpdate({_id:received.parent},{$addToSet:{children:doc._id}},{new:true}).exec()
                else
                    handler.sendResult(res,response);
            })
            .then(function(childDoc){
                console.log(childDoc);
                handler.sendResult(res,response);
            })
            .catch(function(err){
                response.message =err;
                handler.sendError(res,response,err.message || JSON.stringify(err));
            })

    },

    save:function(req,res,next){
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
            info:received.info || null,
            result:[],
            message:"unknown failure"}

        if(req.body.response)
            response = req.body.response;

        let populate = '';
        let search = received._id? {_id:received._id} : received;
        if(received.search)
            search = received.search;
        if(received.populate){
            populate = received.populate;
        }
        let update = received;
        if(received.updateExpr)
            update = received.updateExpr;
        if(update._id)
            delete update._id;
        if(update.populate)
             delete update.populate;


        tableList[tableId].findOneAndUpdate(search,update,{upsert:true,setDefaultsOnInsert:true,new:true},function(err,result){
            if(err){
                handler.sendError(res,response,err);
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

    uploadGeneral:function(req,res){
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
				if(received.updateExpr)
    				received.updateExpr.date = Date.now();
				else if(received.search)
				    received.search.date = Date.now();
				else
				    received.date = Date.now();
                req.body.data = encodeURIComponent(LZString.compressToBase64(JSON.stringify(received)));
                handler.save(req,res);
            });
        }else
            throw Error('something went wrong when processing the file upload');
    },

    uploadAttach:function(req,res){
        let receivedStr = req.body.data;
        receivedStr = decodeURIComponent(req.body.data);
        let received = JSON.parse(LZString.decompressFromBase64(receivedStr));

        let response = {
            sent:false,
            maxCount:0,
            message:"unknown failure",
            info: received.info || null
        };
        let UploadExist = req.files && req.files.length > 0 ;
        if(!UploadExist && req.body.saveRec){
            handler.save(req,res);
            return;
        }else if(!UploadExist && !req.body.saveRec){
            handler.sendError(res,response,'something went wrong when processing the file upload replacement');
            return;
        }

        let bulkAttach = [];



        for(let i=0;i<req.files.length;++i){
            let insert =  {updateOne: {
                        filter: {"name":req.files[i].originalname, "link":'attachments/'+req.files[i].filename},
                        update: {"updatedAt":Date.now()},
                        upsert: true}};
            bulkAttach.push(insert);
        }

        attachModel.bulkWrite(bulkAttach,function(err,feedback){
            let attachments = feedback.result.upserted;
            if(err)
                handler.sendError(res,response,err)
            else if(req.body.saveRec){
                let attachlist = received.attachments;
                if(!attachlist && received.updateExpr)
                    attachlist = received.updateExpr.attachments;
                else if(!attachlist)
                    attachlist = received.attachments = [];
                for(let i=0;i < attachments.length;++i){
                    attachlist.push(attachments[i]._id);
                }
                req.body.data = encodeURIComponent(LZString.compressToBase64(JSON.stringify(received)));
                req.body.resposne = response;
                response.attachments = attachments;
                req.files = null;
                handler.save(req,res);
            }else{
                response.attachments = attachments;
                response.message = "";
                response.success = true;
                handler.sendResult(res,response);
            }
        });
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
router.get('/project/report',handler.pmReport);
router.get('/developer',handler.developer);
router.get('/account',handler.account);
router.get('/efforts',handler.effort);
router.post('/hrsByEng',handler.hrsByEng);
router.get('/tutorial',handler.tutorial);
router.get('/tutorial/:contentId',handler.tutorial);
router.get('/tasks',handler.taskManager)
router.get('/task/info',handler.taskInfo);
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
router.post('/newTask/',handler.saveTask);
router.post('/delete/:tableId',handler.delete);
router.post('/upload/general/:tableId',handler.uploadGeneral);
router.post('/upload/attach/:tableId',handler.uploadAttach);
router.post('/deleteDoc/',handler.deleteDoc);
router.post('/deleteTaskComment/',handler.deleteTaskComment);
router.post('/replaceUpload/:tableId',handler.replaceUpload);
router.post('/getInfo/developers',handler.developers);
router.post('/getInfo/products',handler.products);
router.post('/getInfo/taskComment/',handler.taskComment);
router.post('/task/updateProgress/',handler.updateTaskProgress);
router.post('/login/',handler.login);
router.post('/logout/',handler.logout);
router.post('/pwdReset/',handler.pwd);


module.exports = function(app){
    let generalMulter = multer({dest:systemPath+'temp/'});
    let attachMulter = multer({dest:systemPath+'attachments/'});
    app.use('/lib',express.static(path.join(basedir,"/public/lib")));
    app.use('/js',express.static(path.join(basedir,"/public/js")));
    app.use('/css',express.static(path.join(basedir,"/public/css")));
    app.use('/img',express.static(path.join(basedir,"/public/img")));
    app.use('/assets',express.static(systemSetting.DocLocalPath));
    app.use('/fontawesome',express.static(path.join(basedir,"/public/fontawesome")));

    app.use('/upload/general/',generalMulter.any());
    app.use('/upload/attach/',attachMulter.any());
    app.use(cookie());

    redisClient.on("error",function(error){
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