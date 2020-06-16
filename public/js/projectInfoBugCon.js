app.controller("bugCon",function($scope,$rootScope,$compile,$location,$window,$filter,dataManager) {
    $scope.bugs = [];
    $scope.releases = [];

    $scope.bugStatus = [
        {name:'open',value:'0'},
        {name:'investigate',value:'1'},
        {name:'solved',value:'2'},
        {name:'closed',value:'3'},
        {name:'pended',value:'4'}
    ];

    $scope.newBug = {
        current:"0",
        developers:[],
        status: "0",
        priority:"3",
        title:"",
        comment:"",
        type:0,
        toBeSaved:[]
    };

    $scope.currentBug = null;

    $scope.addDeveloper = "0";

    $scope.newDeveloper = function(){
        if($scope.addDeveloper == '0')
            return;
        if($scope.newBug.toBeSaved.indexOf($scope.addDeveloper)>=0){
            alert('不能重复添加开发人员');
            return;
        }
        let user = {_id:$scope.addDeveloper};
        for(let i=0; i<$rootScope.developers.length;++i){
            if($rootScope.developers[i]._id === $scope.addDeveloper){
                $scope.newBug.developers.push($scope.developers[i]);
                $scope.newBug.toBeSaved.push($scope.addDeveloper);
                $scope.addDeveloper = "0";
                break;
            }
        }
    };

    $scope.removeDeveloper = function(id){
        if($scope.newBug.toBeSaved.indexOf(id)<0 ){
            return;
        }
        let developers = $scope.newBug.developers;
        for(let i =0; i< developers.length;++i){
            if(developers[i]._id === id){
                developers.splice(i,1);
                break;
            }
        }
        let TBS =  $scope.newBug.toBeSaved;
        TBS.splice(TBS.indexOf(id),1);
    }

    $scope.changeTaskStatus = function(bug){
        if($scope.currentBug)
            return;
        $scope.currentBug = JSON.parse(JSON.stringify(bug));
        $scope.currentBug.status = $scope.currentBug.status.toString();
        $scope.currentBug.refer = bug;
        $rootScope.submitType = 'changeBugStatus';
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>status:</td><td><select style="width:calc(100% - 2rem);"' +
            'ng-options="status.value as status.name for status in bugStatus" ' +
            'ng-model="currentBug.status"></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(8);
    }

    $scope.addLog = function(bug){
        if($scope.currentBug)
            return;
        $scope.newLog = JSON.parse(JSON.stringify(bug));
        $scope.newLog.refer = bug;
        $scope.newLog.contents = "";
        $rootScope.submitType = 'addBugLog';
        $scope.currentDate = $filter('date')(Date.now(),'&y/&m/&d &h:&i:&s');
        let innerHTML = '<table class="pageCoverTable">' +
            '<tr><td style="width:3rem;">Date:</td><td style="text-align:left;">{{currentDate}}</td><td>Submitter:</td><td>{{user.name}}</td></tr>'+
            '<tr><td colspan="4" style="padding-left:2rem;"><textarea style="width:calc(100% - 2rem);height:6rem;" ng-model="newLog.contents"></textarea></td></tr>'
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(14,25);
    }

    $scope.viewAllLog = function(bug){
        $rootScope.submitType = 'viewAllLogs';
        $scope.logs = bug.logs;
        let innerHTML = '<table class="pageCoverTable" style="margin:1.5rem;">' +
            "<tr style='font-weight:bold;'>" +
            "<td style='min-width:8rem;'>SUBMITTER</td>" +
            "<td style='min-width:6rem;'>DATE</td>" +
            "<td style='min-width:4rem;'>EFFORTS</td>" +
            "<td style='padding-left:1rem;'>COMMENTS</td></tr>"+
            "<tr ng-repeat='log in logs'>" +
            "<td style='min-width:8rem;'>{{log.user.name}}</td>" +
            "<td style='min-width:6rem;'>{{log.date | date:'&y/&m/&d'}} <br> {{log.date | date:'&h:&i:&s'}}</td>" +
            "<td style='min-width:4rem;text-align:center;'>{{log.efforts}}</td>" +
            "<td style='padding-left:1rem;'>{{log.contents}}</td></tr>"+
        '</table><div style="flex:1"></div>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover('100vh',55);
    };

    $scope.$on('viewAllLogsCancelDoc',function(event,data){
        $scope.logs = null;
        cancelDoc();
    });


    $scope.$on('changeBugStatusCancelDoc',function(event,data){
        $scope.currentBug = null;
        cancelDoc();
    });

    $scope.$on('addBugLogCancelDoc',function(event,data){
        $scope.currentBug = null;
        cancelDoc();
    });


    $scope.$on('addBugLog',function(event,data){
        if($scope.newLog.contents  === ""){
            alert('log cannot be empty.')
            return;
        }else if($scope.newLog.contents.length >= 250){
            alert('log can not exceeds 250 characters');
            return;
        }
        let update = {user:$rootScope.user._id,contents:$scope.newLog.contents,task:$scope.newLog._id,populate:'user'};
        dataManager.saveData('developerLog','developer log saved',update);
        cancelDoc();
    });

    $scope.$on('changeBugStatus',function(event,data){
        let updateExpr = {status:Number($scope.currentBug.status)};
        let search = {_id:$scope.currentBug._id};
        let log = {task:$scope.currentBug._id,user:$rootScope.user._id,
            contents:"changed the bug status from"+$filter('bugStatus')($scope.currentBug.refer.status)
                +'to'+ $filter('bugStatus')($scope.currentBug.status),
            populate:'user'};
        dataManager.saveData('developerTask','status updated',{search:search,updateExpr:updateExpr});
        dataManager.saveData('developerLog','developer log saved',log);
    });

    $scope.$on('status updated',function(event,data){
        if(!data.success)
            alert(data.message);
        else{
            $scope.currentBug.refer.status = data.result.status;
            $scope.currentBug = null;
            $rootScope.$broadcast('bug payments updated',data.result);
            cancelDoc();
        }
    })

    $scope.$on('developer log saved',function(event,data){
        if(!data.success)
            alert(data.message);
        else{
            for(let i =0; i<$scope.bugs.length;++i){
                if($scope.bugs[i]._id === data.result.task)
                    $scope.bugs[i].logs.push(data.result);
            }
            if($scope.newLog)
                $scope.newLog = null;
        }
    })


    $scope.$watch('newRelease.toBeSaved.length',function(newVal,oldVal){
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0)
            elements[0].style.height = 17+newVal*1.8+'rem';
    });


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
        $scope.releases.unshift({_id:"0",version:{type:1,info:"please choose a version"}});
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
            dataManager.saveData('projectTask','project Task Saved',{project:$rootScope.project._id,task:data.result._id})
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
        updateQuery.developers = updateQuery.toBeSaved;
        delete updateQuery.toBeSaved;
        updateQuery.status = Number(updateQuery.status);
        updateQuery.priority = Number(updateQuery.priority);
        updateQuery.current = updateQuery.current === "0"? null : updateQuery.current._id;
        updateQuery.populate = 'project developers version';
        delete updateQuery.current;
        dataManager.saveData('developerTask','bugfix saved', updateQuery);
    });

    $scope.showCover = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>title:</td><td><input style="width:12rem" ng-model="newBug.title"></td></tr>'+
            '<tr><td>developers:</td>' +
            '<td><select ng-model="addDeveloper" ng-options="developer._id as developer.name for developer in developers"></select>' +
            '<button class="simpleBtn" style="margin-left:1.5rem;" ng-show="addDeveloper != \'0\'" ng-click="newDeveloper()">ADD</button>'+
            '</td></tr>'+
            '<tr ng-repeat="developer in newBug.developers" ><td colspan="2">' +
            '<button style="margin-right:1rem;" class="simpleBtn" ng-click="removeDeveloper(developer._id)">×</button><span style="margin-right:2rem;">{{developer.name}}</span><span>{{developer.mail}}</span>'+
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
        showPageCover(19);
    };

    $scope.$on('bugs requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.bugs = data.result;
            $rootScope.$broadcast('bug payments updated',data.result);
        }
    });

    $scope.initialize = function(){
        let data = [
            { $match:{$expr:{$and:[{$eq:[{$toObjectId: $rootScope.project._id} ,"$project"]}]}}},
            { $lookup:{from:"versionTask",localField:"_id",foreignField:"version",as:"task"}},
            { $unwind:"$task"},
            { $set: { "task.version": "$version" } },
            { $replaceRoot: { newRoot: "$task" } },
            { $lookup:{  from: "developerTask",localField:"task",foreignField:"_id",as:"info"}},
            { $unwind:"$info"},
            { $set: { "info.version": "$version" } },
            { $replaceRoot: { newRoot: "$info" } },
            { $sort:{date:-1}},
            { $lookup:{  from: "user",localField:"developers",foreignField:"_id",as:"developers"}},
            {$lookup:{  from: "developerLog",
                    let: {taskId: "$_id"},
                    pipeline: [
                        {$match:{$expr:{$eq:["$$taskId","$task"]}}},
                        {$lookup:{from:'user',localField:'user',foreignField:"_id",as:"user"}},
                        {$unwind:"$user"}
                    ],
                    as: "logs"}}
        ];
        dataManager.requestAggregateData('version','bugs requested', data);
    };

    $scope.initialize();
});