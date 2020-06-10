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
                let innerHTML = '<div ng-repeat="item in itemList"><a href="{{item | docLink:\'1\'}}" target="_blank"><img src="{{item | docIcon}}" style="width:1.2rem;"></a></td></tr></div>';
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
            $rootScope.user = JSON.parse(decodeURIComponent(scope.user));

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

app.directive('historyDocList',function($compile){
    return{
        restrict:"A",
        scope:{
            draft:'@'
        },
        link:function(scope,element,attr){
            scope.drafts = JSON.parse(scope.draft);
            if(scope.drafts.length  === 0)
                element.html('<button class="simpleBtnRight">ADD</button>')
            else {
                scope.drafts = JSON.parse(scope.draft);
                let innerHTML = "<div ng-repeat='draft in drafts'>{{draft.name}} {{draft.date | date:'&y/&m/&d'}}</div>"
                let node = $compile(innerHTML)(scope);
                element.html('');
                element.append(node);
            }
        }}
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

    $scope.types =[
        {value:"0",name:"NDA"},
        {value:"1",name:"SOW"},
        {value:"2",name:"SLA"}
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
        let data = [
            { $match:{$expr:{$and:[{$eq:[{$toObjectId: $rootScope.project._id} ,"$project"]},{$lte:["$type",2]}]}}},
            { $lookup:{from:"doc",localField:"_id",foreignField:"parent",as:"draft"}},
        ];
        dataManager.requestAggregateData('docs','contracts requested', data);
    }

    $scope.initialize();
});