var projectStatus = function(status){
    if(status === '5')
        return 'close';
    else if (status === '6')
        return 're-open';
}

app.filter('projectStatus',function(){
    return projectStatus;
});

app.directive('accountInfo',function(){
    return {
        restrict:"A",
        scope:{
            info:"@",
            type:"@"
        },
        link:function(scope,element,attr){
            if(scope.info === "")
                scope.info = null;
            else
                scope.info = JSON.parse(scope.info);
            if(scope.info && scope.info[scope.type]){
                let contents = scope.info[scope.type] || 'No info';
                if(scope.type === "name")
                    contents = '<a href="/account/info?id='+scope.info._id+'" target="_blank">'+contents+'</a>';
                element.html(contents);
            }else
                element.html('<b>No Info</b>');
        }
    }
});

app.directive('docLink',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{
            contents:'@',
            type:'@'
        },
        link:function(scope,element,attr){
            scope.itemList = JSON.parse(scope.contents);
            if(scope.itemList .length === 0){
                element.html('');
                let node = $compile('<b>no updates</b>')(scope);
                element.append(node);
            } else{
                let innerHTML = '<table><tr ng-repeat="item in itemList" style="display:flex;flex-direction:row;">' +
                    '<td style="height:1rem;max-width:1rem;">◉</td>'+
                    '<td class="singleLine" style="max-width:9rem;width:9rem;margin-left:0;text-align:left;">{{item.name | trim}}</td>' +
                    '<td style="display:flex;flex-direction:row;">' +
                    '<div style="opacity:0;height:1rem;width:1px;overflow::hidden;pointer-events:none;">{{item | docLink:assetLink}}</div>' +
                    '<div><button class="simpleBtn" style="font-weight:bold;" onclick="copyPrev(this)">COPY</button></div>' +
                    '</td></tr></table>';
                let node = $compile(innerHTML)(scope);
                element.html('');
                element.append(node);
            }
     }}
});

app.directive('paymentStatus',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{
            status:'@'
        },
        link:function(scope,element,attr){
            element.css('fontWeight','bold');
            if(scope.status === '2')
                element.css('color','darkolivegreen')
            else if(scope.status === '3')
                element.css('color','blue')
            else
                element.css('color','red');
        }}
});

app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.project = JSON.parse(decodeURIComponent(scope.project));
            $rootScope.users = JSON.parse(decodeURIComponent(scope.users));
            scope.setting = decodeURIComponent(scope.setting);
            scope.setting = scope.setting.replace(/\\r\\n/gi,"");
            $rootScope.setting = JSON.parse(scope.setting);
            $rootScope.setting = $rootScope.setting.replace(/\\/gi,"\\\\");
            $rootScope.setting = JSON.parse($rootScope.setting);
            delete scope.users;
            delete scope.project;
            delete scope.setting;
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
        scope:{

        },
        link:function(scope,element,attr){
            scope.refreshTab = function(){
                let tabSign = element.html();
                scope.select = tabSign === $rootScope.currentPage;
                if(scope.select){
                    element.css('background','white');
                    element.css('cursor','pointer');
                }else{
                    element.css('background','lightgray');
                    element.css('cursor','auto');
                }
            };

            scope.$on('selection changed',function(event, sign){
                scope.refreshTab();
            });

            element
                .on('mouseenter',function(){
                    element.css('background','white');
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    let attr = element.html();
                    if(!scope.select){
                        element.css('background','lightgray');
                        element.css('cursor','auto');
                    }
                })
                .on('click',function(){
                    let sign = element.html();
                    let info = $location.search();
                    info.pid = $rootScope.pageList.indexOf(sign)+1;
                    $location.search(info);
                    $rootScope.currentPage = sign;
                    $rootScope.$apply();
                    $rootScope.$broadcast('selection changed',sign);
                });

            scope.refreshTab();
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

    $rootScope.currentPageIndex = function(){
        return $rootScope.pageList.indexOf($rootScope.currentPage)+1;
    };

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
        }else{
            $rootScope.$broadcast($rootScope.submitType,null);
        }
    };

    $rootScope.cancelDoc = function(){
        $rootScope.$broadcast($rootScope.submitType+'CancelDoc');
    }
});

app.controller('alertCon',function($scope,$rootScope,$location,dataManager) {
    $scope.alerts = [];

    $scope.gotoPage = function(index){
        let info = $location.search();
        info.pid = index;
        $location.search(info);
        $rootScope.currentPage = $rootScope.pageList[index-1];
        $rootScope.$broadcast('selection changed',$rootScope.pageList[index-1]);
    }

    $scope.$on('alert payments updated',function(event,data){
        $scope.alerts = [];
        for(let i=0; i<data.length;++i){
            if(data[i].status <2)
                $scope.alerts.push(data[i]);
        }
    });

    $scope.noAlert = function(){
        return $scope.alerts.length === 0;
    }
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
        type:0,
        toBeSaved:[]
    };

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
        updateQuery.developers = updateQuery.toBeSaved;
        delete updateQuery.toBeSaved;
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
            {$sort:{date:-1}},
            {$lookup:{  from: "user",localField:"developers",foreignField:"_id",as:"developers"}},
           ];
        dataManager.requestAggregateData('version','bugs requested', data);
    };

    $scope.initialize();

});


app.controller("docCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.docs = [];
    $scope.newContract = {
        name:"",
        type:"0",
        source:"0",
        reference:"",
        description:"",
        link:""
    }

    $scope.sources =[
        {value:"0",name:"assets"},
        {value:"1",name:"online"},
        {value:"2",name:"fileserver"},
    ];

    $scope.saveDoc = null;

    $scope.$watch('newContract',function(newVal,oldVal){
        if($rootScope.submitType === 'contracts' && $scope.newContract)
            $scope.saveDoc = JSON.parse(JSON.stringify($scope.newContract));
    },true);

    $scope.edit = function(doc){
        if(!$scope.saveDoc){
            $scope.saveDoc = JSON.parse(JSON.stringify($scope.newContract));
        }
        $scope.newContract = JSON.parse(JSON.stringify(doc));
        if(typeof $scope.newContract.type === 'number')
           $scope.newContract.type = $scope.newContract.type.toString();
        if(typeof $scope.newContract.source === 'number')
             $scope.newContract.source = $scope.newContract.source.toString();
        $scope.showCoverContents('editContract');
    };

    $scope.showCover = function(type){
        $scope.newContract = $scope.saveDoc? JSON.parse(JSON.stringify($scope.saveDoc)) : {
            name:"",
            type:"0",
            source:"0",
            reference:"",
            description:"",
            link:""
        };

        if($scope.saveDoc)
            $scope.saveDoc = null;
        $scope.showCoverContents(type);
    };

    $scope.$on('contracts',function(event,data){
        let saveQuery = JSON.parse(JSON.stringify($scope.newContract));
        if(saveQuery.name === ''){
            alert('You must specify the name for your document.');
            return;
        }else if(saveQuery.description === ""){
            alert('you must add some cmomments for your document');
            return;
        }

        saveQuery.source = Number(saveQuery.source);
        saveQuery.type = Number(saveQuery.type);
        saveQuery.account = $rootScope.project.account._id;
        saveQuery.project = $rootScope.project._id;
        saveQuery.populate = 'parent';

        $rootScope.saving = true;
        dataManager.saveData('docs','new contract saved', saveQuery);
    })

    $scope.$on('new contract saved',function(event,data){
        $rootScope.saving = false;
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs.unshift(data.result);
            cancelDoc();
        }
    });

    $scope.$on('contractsCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    });

    $scope.$on('editContractCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    });

    $scope.$on('contracts requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs = data.result;
        }
    });

    $scope.showCoverContents = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>name:</td><td><input style="width:12rem" ng-model="newContract.name"></td></tr>'+
            '<tr><td>type:</td>' +
            '<td><select ng-model="newContract.type" style="width:10rem;" ng-options="type.value as type.name for type in types"></select></td></tr>' +
            '<tr><td>source:</td><td><select style="width:4rem;" ng-model="newContract.source" ng-options="source.value as source.name for source in sources"></select></td></tr>'+
            '<tr><td>link:</td><td><input style="width:12rem" ng-model="newContract.link"></td></tr>'+
            '<tr><td>description:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newContract.description"></textarea></td></tr>'+
            '<tr><td>reference:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newContract.reference"></textarea></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(22);
    };

    $scope.initialize = function(){
        dataManager.requestData('docs','contracts requested', {project:$rootScope.project._id, type: {$lte:2}});
    }

    $scope.initialize();
});