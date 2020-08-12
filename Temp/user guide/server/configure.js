var bodyparser = require('body-parser'),
    path = require('path'),
    cookie = require('cookie-parser'),
    ejs = require('ejs');

let basedir = path.join(path.resolve(__dirname),'../');

let viewFolder = path.join(path.join(basedir,'/view/'));

module.exports=function(app){
    app.set('trust proxy',true);
    app.set('views',viewFolder);
    app.engine('.html',ejs.__express);
    app.set('view engine','html');

    app.use(cookie());

    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({extended:true}));

    return app;
};