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
                let innerHTML = '<div ng-repeat="item in itemList" style="margin-bottom:2px;">' +
                    '<a href="{{item | docLink:\'1\'}}" target="_blank">' +
                    '<img src="{{item | docIcon}}" style="width:1.2rem;">' +
                    '<span style="max-width:6rem;margin-left:4px;">{{item.name}}</span>'+
                    '</a></td></tr></div>';
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
    $rootScope.pageList = ['comments','release history','bugfix','contracts','payment','purchase order'];
    if(!pageId)
        pageId = 1;
    else
        pageId = Number(pageId);
    $rootScope.saving = false;

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

    $rootScope.uploadDoc = function(doc){

    };

    $rootScope.saveDoc = function(doc){

    }

    $rootScope.cancelDoc = function(){
        $rootScope.$broadcast($rootScope.submitType+'CancelDoc');
    }

    $scope.hangProject = function(){
        if($rootScope.projectUpdating)
            return;
        $rootScope.projectUpdating = true;
        let updateQuery = {
            populate: 'account',
            search:{_id:$rootScope.project._id},
            updateExpr:{
                status:7,
                schedule:null
            }
        }

        dataManager.saveData('project','project status updated', updateQuery);
    }

    let renameAttach = function(blob,filename){
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            const body = document.querySelector('body');

            link.href = window.URL.createObjectURL(blob);
            link.download = filename;

            // fix Firefox
            link.style.display = 'none';
            body.appendChild(link);

            link.click();
            body.removeChild(link);

            window.URL.revokeObjectURL(link.href);
        }
    };

    $rootScope.openAttach = function(link,name){
        if($rootScope.openAttaching)
            return;
        $rootScope.openAttaching = true;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/assets/'+link, true);
        xhr.responseType = 'blob';
        xhr.onload = () => {
            $rootScope.openAttaching = false;
            if (xhr.status === 200) {
                renameAttach(xhr.response,name);
            }
        };

        xhr.send();
    }
});