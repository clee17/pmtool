var projectStatus = function(status){
    if(status === '5')
        return 'close';
    else if (status === '6')
        return 're-open';
}

app.filter('projectStatus',function(){
    return projectStatus;
});

app.directive('docLink',function($compile){
    return{
        restrict:"A",
        scope:{
            contents:'@',
            type:'@'
        },
        link:function(scope,element,attr){
            scope.contents = JSON.parse(scope.contents);
            if(scope.contents .length === 0){
                element.html('');
                let node = $compile('<button ng-click="addInfo(scope.$parent,attr.type)" class="simpleBtn" style="font-weight:bold;">ADD</button>')(scope.$parent.$parent);
                element.append(node);
            } else{
                element.html('<div style="opacity:0;height:1rem;width:1px;overflow::hidden;" ng-repeat="attr in contents">'+attr.info+'</div><div><button onclick="copyPrev(this)">COPY</button></div>');
            }
     }}
});

app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.project = JSON.parse(decodeURIComponent(scope.project));
            $rootScope.users = JSON.parse(decodeURIComponent(scope.users));
            delete scope.users;
            delete scope.project;
            $rootScope.developers = [];
            $rootScope.managers =  [];
            for(let i=0;i<$rootScope.users.length;++i){
                if($rootScope.users[i].department.match(/R&D/i))
                    $rootScope.developers.push($rootScope.users[i]);
                else if($rootScope.users[i].title == 'Program Manager')
                    $rootScope.managers.push($rootScope.users[i]);
            }
        }
    }
});


app.directive('contentFormat',function(){
    return{
        restrict:"EA",
        scope:{
            contents:'@'
        },
        link:function(scope,element,attr){
            let result = scope.contents.replace(/\n/g,'<br>');
            if(result.length === 0)
                result = 'no info';
            element.html(result);
        }
    }
});



app.directive('tabButton',function($rootScope,$location){
    return{
        restrict:"EA",
        link:function(scope,element,attr){
            let sign = element.html();
            scope.select[sign] = sign === $rootScope.currentPage;
            scope.$on('selection changed',function(event, params){
                let attr = element.html();
                if(scope.select[attr]){
                    element.css('background','white');
                    element.css('cursor','pointer');
                }else{
                    element.css('background','lightgray');
                    element.css('cursor','auto');
                }
            });
            scope.$broadcast('selection changed',sign);

            element
                .on('mouseenter',function(){
                    element.css('background','white');
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    let attr = element.html();
                    if(!scope.select[attr]){
                        element.css('background','lightgray');
                        element.css('cursor','auto');
                    }
                })
                .on('click',function(){
                    let sign = element.html();
                    for(let attr in scope.select){
                         scope.select[attr] = attr === sign;
                    }
                    let info = $location.search();
                    info.pid = $rootScope.pageList.indexOf(sign)+1;
                    $location.search(info);
                    scope.switchTab(sign);
                    scope.$broadcast('selection changed',sign);
                });
        }
    }
});


app.directive('deliveryInfo',function(){
    return{
        restrict:"A",
        scope: {
            info:"@"
        },
        link:function(scope,element, attr){
          let project = scope.$parent.project;
          if(project && project.delivery && project.delivery[scope.info]){
              let link = '/'+scope.info+'?id='+project.delivery[scope.info].code;
              let html = scope.info === 'platform'? project.delivery[scope.info] : project.delivery[scope.info].name;
              if(scope.info !== 'platform')
                  html = '<a href="'+link+'">' + html + '</a>';
              element.html(html);
          }
          else
              element.html('<b>The info is missing</b>');
        }
    }
})

app.controller("rootCon",function($scope,$rootScope,$location,$window,dataManager){
    let pageId = $location.search().pid;
    $rootScope.pageList = ['comments','release history','bugfix','contracts','payment'];
    if(!pageId)
        pageId = 1;
    else
        pageId = Number(pageId);
    $rootScope.currentPage = $rootScope.pageList[pageId-1];

    $rootScope.currencies = [
        {icon:"$",value:"0"},
        {icon:"¥",value:"1"},
        {icon:"￥",value:"2"}
    ];

    $rootScope.submitDoc = function(){
        if($rootScope.submitType === 'projectActive'){
            $rootScope.$broadcast('updateProjectActive',null);
        }else if($rootScope.submitType === 'bugfix'){
            $rootScope.$broadcast('addBugfix',null);
        }else if($rootScope.submitType === 'release'){
            $rootScope.$broadcast('addRelease',null);
        }else if($rootScope.submitType === 'payment') {
            $rootScope.$broadcast('addPayment',null);
        }else if ($rootScope.submitType === 'editPayment'){
            $rootScope.$broadcast('editPayment',null);
        }
    };

    $rootScope.cancelDoc = function(){
        $rootScope.$broadcast($rootScope.submitType+'CancelDoc');
    }

    $scope.select = {};


    $scope.switchTab = function(sign){
        $rootScope.currentPage = sign;
        $rootScope.$apply();
    }
});

app.controller("infoCon",function($scope,$rootScope,$location,$window,dataManager){
    $rootScope.currentRelease = null;

    $scope.projectDetail = {
        active:"0"
    };

    $scope.cancelDoc = function(){
        $scope.resetStatus();
        cancelDoc();
    }


    $scope.$watch('projectDetail.active',function(newVal,oldVal){
        if($scope.statusReset){
            $scope.statusReset = false;
            return;
        }
        let innerHTML = '<div style="margin-top:1rem;margin-bottom:1rem;width:calc(100% - 3rem);margin-left:auto;margin-right:auto;">'
            +'Do you wish to set the project status to '
            + projectStatus($scope.projectDetail.active)+
            '?</div>';
        let element = document.getElementById('coverDetail');
        if(element)
            element.innerHTML = innerHTML;
        $rootScope.submitType = 'projectActive';
        showPageCover(8);
    });

    $scope.$on('project active updated',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.project = data.result;
            $rootScope.$broadcast('project Updated',null);
        }
        cancelDoc();
    });

    $scope.$on('current release received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            let result = data.result;
            $rootScope.currentRelease = {};
            if(Array.isArray(result) && result.length >0 ){
                result = result[0];
                $rootScope.currentRelease.title = result.version.main+'.'+result.version.update+'.'+result.version.fix;
                $rootScope.currentRelease.description = result.description;
            }else{
                $rootScope.currentRelease.title = 'no release found';
            }

        }
    });

    $scope.$on('updateProjectActive',function(){
        if($scope.projectDetail.active === '-1'){
            cancelDoc();
            return;
        }
        let updateQuery = {_id:$rootScope.project._id,status:Number($scope.projectDetail.active),populate:'account delivery'};
        if(updateQuery.status === 5){
            updateQuery.schedule = new Date(Date.now());
            updateQuery.schedule.setFullYear(updateQuery.schedule.getFullYear()+1000);
        }
        dataManager.saveData('project','project active updated', updateQuery);
    });

    $scope.resetStatus = function(){
        let listIndex = ['5','6','-1'];
        if($rootScope.project.status === 5)
            $scope.activeOptions = [{value:"5",name:"closed"},{value:"6",name:"re-open"}];
        else if($rootScope.project.status === 6)
            $scope.activeOptions = [{value:"6",name:"re-open"},{value:"5",name:"close"}];
        else
            $scope.activeOptions = [{value:"-1",name:"active"},{value:"5",name:"close"}];
        $scope.statusReset = true;
        $scope.projectDetail.active = $rootScope.project.status.toString();
        if(listIndex.indexOf($scope.projectDetail.active) <0){
            $scope.projectDetail.active = "-1";
        }
    }


    $scope.$on('project info updated',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.project = data.result;
            $rootScope.$apply();
        }
    });

    $scope.initialize = function(){
        $scope.resetStatus();
        let search = {project:$rootScope.project._id};
        let cond = {sort:{date:-1},limit:1};
        dataManager.requestData('version','current release received',{search:search,cond:cond});
        setTimeout(function(){
            $scope.initialized = true;
        },10);
    }

    $scope.initialize();

});

app.controller("commentCon",function($scope,$rootScope,$location,$window,dataManager) {
    $scope.comments = [];
    $scope.contacts = [];

    $scope.commentSubmit = {
        user:"",
        contents:"",
        saving:false
    }

    $scope.projectUpdate = {
        status:"0",
    }

    $scope.updatable = function(){
        return $rootScope.project.status !== 5 && !$scope.commentSubmit.saving;
    }

    $scope.$on('comments received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.comments =  data.result;
        }
    });

    $scope.$on('project Updated',function(event,data){
        $scope.refreshCommentData();
    });

    $scope.refreshCommentData = function(){
        $scope.scheduleNow = new Date($rootScope.project.schedule);
        let day = ("0" + $scope.scheduleNow.getDate()).slice(-2);
        let month = ("0" + ($scope.scheduleNow.getMonth() + 1)).slice(-2);
        let element = document.getElementById('commentTime');
        if(element)
            element.value = $scope.scheduleNow.getFullYear()+'-'+(month)+'-'+day;
    }


    $scope.updateProject = function(dateNow){
        let date = new Date(dateNow);
        let dateSchedule = new Date($rootScope.project.schedule);
        let updated = false;

        if(date != dateSchedule){
            $rootScope.project.schedule = date;
            updated = true;
        }

        if(Number($scope.projectUpdate.status) !== $rootScope.project.status){
            $rootScope.project.status = Number($scope.projectUpdate.status);
            if($rootScope.project.status === 5)
                $rootScope.project.schedule = Infinity;
            updated = true;
        }

        if(updated){
            if($rootScope.project.delivery)
                $rootScope.project.delivery = $rootScope.project.delivery._id;
            $rootScope.project.populate = 'account';
            dataManager.saveData('project','project info updated', $rootScope.project);
        }
    }


    $scope.submitComment = function(){
        if($scope.commentSubmit.contents === "" || $scope.commentSubmit.contents.length < 10){
            alert('评论内容不得少于10个字符');
            return;
        }
        $scope.commentSubmit.saving = true;
        let data = {
            date:new Date(Date.now()),
            comment: $scope.commentSubmit.contents,
            user: $scope.commentSubmit.user,
            project:$rootScope.project._id
        };

        let element = document.getElementById('commentTime');
        if(element)
            data.schedule = new Date(element.value);
        data.schedule.setHours(new Date(Date.now()).getHours());
        data.schedule.setMinutes(new Date(Date.now()).getMinutes());
        data.schedule.setSeconds(new Date(Date.now()).getSeconds());
        if($scope.projectUpdate.status !== $rootScope.project.status.toString())
            data.comment += '\n\n <b style="color:darkred">The status of the project has been changed from '
                +getCurrentStatus($rootScope.project.status)+
                ' to ' +
                getCurrentStatus($scope.projectUpdate.status)+'</b>';
        data.status = $rootScope.project.status;
        data.populate = 'user';
        dataManager.saveData("projectComment","project comment saved", data);
    };


    $scope.$on('project comment saved',function(event,data){
        $scope.commentSubmit.saving = false;
        if(!data.success){
            $scope.projectUpdate.status = $rootScope.project.status.toString();
            alert(data.message);
        }else{
            $scope.comments.push(data.result);
            $scope.refreshCommentData();
            $scope.commentSubmit.contents = "";
            $scope.updateProject(data.result.schedule);
        }
    })


    $scope.$on('contacts received',function(event,data){
       if(!data.success){
           alert(data.message);
       }else{
           $scope.contacts = data.result;
       }
    });

    $scope.initialize = function(){
        $scope.projectUpdate.status = $rootScope.project.status.toString();
        dataManager.requestData('projectComment','comments received',{populate:'user',search:{project:$rootScope.project._id},cond:{sort:{date:1}}});
        if($rootScope.project.account)
           dataManager.requestData('contacts','contacts received',{populate:'company',search:{company:$rootScope.project.account._id},cond:{sort:{name:1}}});
        else
           $scope.contacts = $rootScope.manangers;
        $scope.commentSubmit.user = "5e797da1b8859cb0fa0d29bd";
        $scope.refreshCommentData();
    }

    $scope.initialize();
});

app.controller("bugCon",function($scope,$rootScope,$compile,$location,$window,dataManager) {
    $scope.bugs = [];
    $scope.releases = [];

    $scope.newBug = {
        project:$rootScope.project._id,
        current:"0",
        developers:[],
        status: "0",
        priority:"3",
        title:"",
        comment:"",
        type:0
    };

    $scope.addDeveloper = "0";

    $scope.$watch('newBug.developers.length',function(newVal,oldVal){
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0)
            elements[0].style.height = 17+newVal*1.8+'rem';
    });

    $scope.$on('bugfixCancelDoc',function(event,data){
        cancelDoc();
    });

    $scope.$on('versions updated',function(event,data){
        $scope.releases = JSON.parse(JSON.stringify($rootScope.versions));
         $scope.releases.unshift({_id:"0",version:{type:1}});
    });

    $scope.$on('bugfix saved',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            let updateQuery = {
                version:$scope.newBug.current,
                task:data.result._id
            }
            $scope.bugs.push(data.result);
            dataManager.saveData('versionTask','version saved', updateQuery);
        }
    });


    $scope.$on('version saved',function(event,data){
        $rootScope.saving = false;
        if(!data.success){
            alert(data.message);
        }else{
            $scope.newBug.current = "0";
            cancelDoc();
        }
    });

    $scope.$on('addBugfix',function(event,data){
        $rootScope.saving = true;
        let newBug = $scope.newBug;
        if(newBug.comment === ""){
            alert("bugfix的描述不能为空");
            return;
        }else if(newBug.current === "0"){
            alert("必须选择当前bug出现的版本");
            return;
        }
        let updateQuery = JSON.parse(JSON.stringify($scope.newBug));
        for(let i=0; i< updateQuery.developers.length;++i){
            updateQuery.developers[i] = updateQuery.developers[i]._id;
        }
        updateQuery.status = Number(updateQuery.status);
        updateQuery.priority = Number(updateQuery.priority);
        updateQuery.current = updateQuery.current === "0"? null : updateQuery.current._id;
        updateQuery.populate = 'project developers';
        delete updateQuery.current;
        dataManager.saveData('projectTask','bugfix saved', updateQuery);
    });

    $scope.showCover = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>title:</td><td><input style="width:12rem" ng-model="newBug.title"></td></tr>'+
            '<tr><td>developers:</td>' +
            '<td><select ng-model="addDeveloper" ng-options="developer._id as developer.name for developer in developers"></select>' +
            '<button class="simpleBtn" style="margin-left:1.5rem;" ng-show="addDeveloper != \'0\'" ng-click="newDeveloper()">ADD</button>'+
            '</td></tr>'+
            '<tr><td>version:</td>' +
            '<td><select ng-model="newBug.current" ng-options="release._id as release.version|version for release in releases"></select></td></tr>'+
            '<tr><td>Priority:</td><td><select style="width:4rem;"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td></tr>'+
            '<tr><td>comment:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newBug.comment"></textarea></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(17);
    };

    $scope.$on('bugs requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.bugs = data.result;
        }
    });

    $scope.initialize = function(){
        let data = [
            {$match:{project:{value:$rootScope.project._id,type:'ObjectId'}}},
            {$lookup:{from:"versionTask",localField:"_id",foreignField:"version",as:"task"}},
            {$unwind:"$task"},
            { $set: { "task.version": "$version" } },
            {$replaceRoot: { newRoot: "$task" } },
            {$lookup:{  from: "projectTask",localField:"task",foreignField:"_id",as:"info"}},
            {$unwind:"$info"},
            { $set: { "info.version": "$version" } },
            {$replaceRoot: { newRoot: "$info" } },
            {$sort:{date:-1}}
           ];
        dataManager.requestAggregateData('version','bugs requested', data);
    };

    $scope.initialize();

});


app.controller("releaseCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.addDeveloper = "0";
    $rootScope.versions = [];
    $scope.newRelease = {
        developers:[],
        toBeSaved:[],
        position:"",
        description:"",
        priority:"1",
        version:{
            main:1,
            update:0,
            fix:0
        }
    }

    $scope.expandData = function(event){
        let target = event.target;
        let visible = target.className === 'fa fa-angle-up';
        let root = target;
        while(root.className !== "entry"){
            root = root.parentElement;
        }
        if(visible){
            let contents = root.children[1];
            contents.style.height = '1rem';
            target.className = 'fa fa-angle-down';
        }else{

            let contents = root.children[1];
            let newDiv  = document.createElement('DIV');
            if(newDiv)
                newDiv.innerHTML = contents. innerHTML;
            newDiv.style.width = contents.style.width;
            newDiv.style.position = "absolute";
            newDiv.style.left = '0';
            newDiv.style.right = '0';
            root.appendChild(newDiv);
            newDiv.style.opacity = '0';
            contents.style.height = newDiv.scrollHeight+'px';
            contents.style.webkitLineClamp = '100';
            root.removeChild(newDiv);
            target.className = 'fa fa-angle-up';
        }
    }

    $scope.newDeveloper = function(){
        if($scope.addDeveloper == '0')
            return;
        if($scope.newRelease.toBeSaved.indexOf($scope.addDeveloper)>=0){
            alert('不能重复添加开发人员');
            return;
        }
        let user = {_id:$scope.addDeveloper};
        for(let i=0; i<$scope.developers.length;++i){
            if($scope.developers[i]._id === $scope.addDeveloper){
                $scope.newRelease.developers.push($scope.developers[i]);
                $scope.newRelease.toBeSaved.push($scope.addDeveloper);
                $scope.addDeveloper = "0";
                break;
            }
        }
    };

    $scope.removeDeveloper = function(id){
        if($scope.newRelease.toBeSaved.indexOf(id)<0 ){
            return;
        }
        let developers = $scope.newRelease.developers;
        for(let i =0; i< developers.length;++i){
            if(developers[i]._id === id){
                developers.splice(i,1);
                break;
            }
        }
        let TBS =  $scope.newRelease.toBeSaved;
       TBS.splice(TBS.indexOf(id),1);
    }

    $scope.$watch('newRelease.toBeSaved.length',function(newVal,oldVal){
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0)
            elements[0].style.height = 17+newVal*1.8+'rem';
    });

    $scope.showCover = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>Release Version:</td><td><input style="width:2rem" ng-model="newRelease.version.main">:<input style="width:3rem;" ng-model="newRelease.version.update">:<input style="width:4rem;" ng-model="newRelease.version.fix"></td></tr>'+
            '<tr><td>Positon:</td><td><input ng-model="newRelease.position"></td></tr>' +
            '<tr><td>Developers:</td><td style="display:flex;flex-direction:row;">' +
            '<select ng-model="addDeveloper" ng-options="developer._id as developer.name for developer in developers"></select>' +
            '<button class="simpleBtn" style="margin-left:1.5rem;" ng-show="addDeveloper != \'0\'" ng-click="newDeveloper()">ADD</button></td></tr>' +
            '<tr ng-repeat="developer in newRelease.developers" ><td colspan="2">' +
            '<button style="margin-right:1rem;" class="simpleBtn" ng-click="removeDeveloper(developer._id)">×</button><span style="margin-right:2rem;">{{developer.name}}</span><span>{{developer.mail}}</span>'+
            '</td></tr>'+
            '<tr><td colspan="2">' +
            '<select ng-model=""></select></td></tr>'+
            '<tr><td>Priority:</td><td><select style="width:4rem;"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td></tr>'+
            '<tr><td>Description:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newRelease.description"></textarea></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(17);
    };

    $scope.$on('developers received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.developers = data.result;
            $scope.developers.unshift({_id:"0",name:"请选择开发人员"});
        }
    });

    $scope.$on('addRelease',function(event,data){
        $rootScope.saving = true;
        let updateSave = JSON.parse(JSON.stringify($scope.newRelease));
        updateSave.developers = updateSave.toBeSaved;
        delete updateSave.toBeSaved;
        updateSave.version.main = Number(updateSave.version.main);
        updateSave.version.udpate = Number(updateSave.version.update);
        updateSave.version.fix = Number(updateSave.version.fix)
        updateSave.date = Date.now();
        updateSave.priority = Number(updateSave.priority);
        updateSave.project = $rootScope.project._id;
        $scope.updateSave = updateSave;
        dataManager.requestData('version','search version existed',{version:updateSave.version,project:updateSave.project});
    });

    $scope.$on('search version existed',function(event,data){
        if(!data){
            alert('data is null');
        }else if(!data.success){
            alert(data.message);
        }else {
            if(data.result.length > 0)
                alert('该版本已经存在，请修改信息。');
            else{
                dataManager.saveData('version','version saved',$scope.updateSave);
            }
        }
    });

    $scope.$on('versions received',function(event,data){
        if(!data){
            alert('failed to retrieve historic versions.');
        }else if(!data.success){
            alert(data.message);
        }else {
            $rootScope.versions = data.result;
            $rootScope.$broadcast('versions updated',null);
        }
    });

    $scope.$on('version saved',function(event,data){
        $rootScope.saving = false;
        $scope.updateSave = null;
        if(!data){
            alert('data is null');
        }else if(!data.success){
            alert(data.message);
        }else {
            $scope.newRelease.version = {main:data.result.version.main,update:data.result.version.update,fix:data.result.fix+3};
            $scope.newRelease.description = "";
            $scope.newRelease.toBeSaved = $scope.newRelease.developers = [];
            $rootScope.versions.push(data.result);
            cancelDoc();
        }
    });

    $scope.initialize = function(){
        let data = {};
        let regExp = new RegExp("R&D","i");
        data.search = {department:{$regex: {value:"R&D",cond:"i"}}};
        data.cond = {sort:{name:1}};
        dataManager.requestData('user','developers received',data);
        dataManager.requestData('version','versions received',{project:$rootScope.project._id});
    }

    $scope.initialize();
});


app.controller("docCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.docs = [];

    $scope.$on('contracts requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs = data.result;
        }
    });

    $scope.initialize = function(){
        dataManager.requestData('docs','contracts requested', {project:$rootScope.project._id, type: {$lte:2}});
    }

    $scope.initialize();
});

app.controller("paymentCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.payments = [];
    $scope.invoiceList = [];
    $scope.docs = [];
    $scope.addPayment = null;

    $scope.resetPayment =function(){
        $scope.newPayment = {
            PO:"",
            status:"0",
            comment:"",
            invoice:"0",
            doc:"0",
            amount:"",
            currency:"0"
        };
    };

    $scope.$watch('newPayment',function(newVal, oldVal){
        if($rootScope.submitType === 'payment')
            $scope.addPayment = JSON.parse(JSON.stringify($scope.newPayment));
    },true);

    $scope.edit = function(payment){
        $scope.newPayment = JSON.parse(JSON.stringify(payment));
        $scope.newPayment._id = payment._id;
        let status = $scope.newPayment.status.toString();
        $scope.newPayment.currency = $scope.newPayment.currency.toString();
        $scope.newPayment.status = status? status: "0";
        $scope.showCoverContents('editPayment');
    };

    $scope.addPaymentInvoice = function(payment){

    };

    $scope.showCover = function(type){
        if($scope.addPayment){
            $scope.newPayment = JSON.parse(JSON.stringify($scope.addPayment));
            $scope.addPayment = null;
        }
        $scope.showCoverContents(type);
    }

    $scope.$on('editPayment',function(event,data){
        //TO BE ADDED
    });

    $scope.$on('editPaymentCancelDoc',function(event,data){
        $scope.resetPayment();
        delete $scope.newPayment._id;
        cancelDoc();
    })

    $scope.$on('paymentCancelDoc',function(event,data){
        cancelDoc();
    })

    $scope.$on('addPayment',function(event,data){
        if($scope.newPayment.PO.length === 0){
            alert('PO 不能为空');
            return;
        }else if($scope.newPayment.comment.length === 0) {
            alert('说明不能为空');
            return;
        }else  if($scope.newPayment.status !== '0' && $scope.newPayment.invoice === '0'){
            alert('该状态下invoice不能为空');
            return;
        }else if($scope.newPayment.amount < 0 ){
            alert('付款数量不能为空');
            return;
        }

        let updateQuery = JSON.parse(JSON.stringify($scope.newPayment));
        updateQuery.status = Number(updateQuery.status);
        updateQuery.date = Date.now();
        updateQuery.project = $rootScope.project._id;
        updateQuery.account = $rootScope.project.account._id;
        updateQuery.invoice = updateQuery.invoice === '0' ? null : updateQuery.invoice;
        updateQuery.doc = updateQuery.doc === '0' ? null : updateQuery.doc;
        updateQuery.populate = 'invoice account';
        dataManager.saveData('payment','payment added', updateQuery);
    });

    $scope.$on('payment added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.payments.push(data.result);
            $scope.resetPayment();
            cancelDoc();
        }
    });


    $scope.showCoverContents = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>amount:</td><td><input type="number" ng-model="newPayment.amount" style="width:6rem;margin-right:0.5rem;">' +
            '<select  ng-model="newPayment.currency" ng-options="currency.value as currency.icon for currency in currencies"></select>'+
            '<tr><td>PO:</td><td><input style="width:12rem" ng-model="newPayment.PO"></td></tr>'+
            '<tr><td>status:</td><td><select ng-model="newPayment.status">' +
            '<option value="0">PO Received</option>' +
            '<option value="1">invoice issued</option>' +
            '<option value="2">Paid</option>' +
            '<option value="3">Partly Paid</option>' +
            '</select></td></tr>' +
            '<tr ng-show="newPayment.status !== \'0\'"><td>Invoice</td><td>' +
            '<select ng-model="newPayment.invoice" ng-options="invoice._id as invoice.name for invoice in invoiceList"></select>' +
            '</td></tr>'+
            '<tr><td>docs</td><td>' +
            '<select ng-model="newPayment.doc" ng-options="doc._id as doc.name for doc in docs"></select>' +
            '</td></tr>'+
            '<tr><td>Description</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newPayment.comment"></textarea></td></tr>'
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(19);
    };


    $scope.$on('payments requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.payments = data.result;
        }
    });

    $scope.$on('invoices requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.invoiceList = [
                {_id:"0",name:"add invoice"}
            ];
            $scope.invoiceList = $scope.invoiceList.concat(data.result);
        }
    });

    $scope.$on('docs requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs = [
                {_id:"0",name:"add doc"}
            ];
            $scope.docs = $scope.docs.concat(data.result);
        }
    });

    $scope.initialize = function(){
        let data = [
            {$match:{project:{value:$rootScope.project._id,type:'ObjectId'}}},
            {$sort:{date:-1}},
            {$lookup:{from:"account",localField:"account",foreignField:"_id",as:"account"}},
            {$unwind:"$account"},
            {$lookup:{  from: "paymentDocs",
                        let: {paymentId: "$_id"},
                        pipeline: [
                            {$match:{$expr:{$and:[{$eq: ["$type",0]}, {$eq:["$$paymentId", "$payment"]}]}}},
                            {$lookup:{from:'doc',localField:'doc',foreignField:"_id",as:"doc"}},
                        ],
                            as: "invoice"}},
            {$lookup:{  from: "paymentDocs",
                        let: {paymentId: "$_id"},
                        pipeline: [
                            {$match:{$expr:{$and:[{$eq: ["$type",1]}, {$eq:["$$paymentId", "$payment"]}]}}},
                            {$lookup:{from:'doc',localField:'doc',foreignField:"_id",as:"doc"}},
                        ],
                            as: "doc"}}];
        $scope.resetPayment();
        dataManager.requestAggregateData('payment','payments requested', data);
        dataManager.requestData('docs','invoices requested', {project:$rootScope.project._id, type:4});
        dataManager.requestData('docs','docs requested', {project:$rootScope.project._id, type: {$in:[2,3]}});
    }

    $scope.initialize();
});