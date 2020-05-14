app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.project = JSON.parse(decodeURIComponent(scope.project));
            scope.users = JSON.parse(decodeURIComponent(scope.users));
            scope.initialize();
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
            element.html(result);
        }
    }
});


app.directive('tabButton',function(){
    return{
        restrict:"EA",
        link:function(scope,element,attr){
            let sign = element.html();
            scope.select[sign] = sign === 'comments';
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

app.controller("infoCon",function($scope,$rootScope,$location,$window,dataManager){
    $rootScope.getCurrentStatus = function(status){
        if(typeof status !== 'number')
            status = Number(status);
        let statusList = ['opportunities', 'business','development','delivery','maintenance','closed','re-open'];
        return statusList[status];
    };

    $scope.pageIndex = {
        startIndex:1,
        pageId:1,
        pageMax:1,
        goToPage:function(index){
            $location.search('pid',index.toString());
            $window.location.href = $location.absUrl();
        }
    }
    $scope.comments = [];
    $scope.select = {};
    $scope.currentPage = "comments";
    $scope.refreshCommentData = function(){
        $scope.scheduleNow = new Date($scope.project.schedule);
        let day = ("0" + $scope.scheduleNow.getDate()).slice(-2);
        let month = ("0" + ($scope.scheduleNow.getMonth() + 1)).slice(-2);
        let element = document.getElementById('commentTime');
        if(element)
            element.value = $scope.scheduleNow.getFullYear()+'-'+(month)+'-'+day;
    }

    $scope.commentSubmit = {
        user:"",
        contents:"",
        saving:false
    }

    $scope.projectUpdate = {
        status:"0",
    }

    $scope.updatable = function(){
        return $scope.project.status !== 5;
    }

    $scope.requestPage = function(){
        $scope.pageIndex.pageMax = Math.ceil($scope.contents.maxCount/25);
        $scope.pageIndex.pageId = $location.search().pid||1;
        $scope.pageIndex.startIndex = $scope.pageIndex.pageId - 7;
        if($scope.pageIndex.startIndex<1)
            $scope.pageIndex.startIndex = 1;
    };

    $scope.switchTab = function(sign){
        $scope.currentPage = sign;
        $scope.$apply();
    }

    $scope.updateProject = function(dateNow){
        let date = new Date(dateNow);
        let dateSchedule = new Date($scope.project.schedule);
        if(date > dateSchedule){
            $scope.project.schedule = date;
            if($scope.project.delivery)
                $scope.project.delivery = $scope.project.delivery._id;
            if(Number($scope.projectUpdate.status) !== $scope.project.status)
                $scope.project.status = Number($scope.projectUpdate.status);
            if($scope.project.status === 5)
                $scope.project.schedule = Infinity;
            dataManager.saveData('project','project info updated', $scope.project);
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
            project:$scope.project._id
        };

        let element = document.getElementById('commentTime');
        if(element)
            data.schedule = new Date(element.value);
        data.schedule.setHours(new Date(Date.now()).getHours());
        data.schedule.setMinutes(new Date(Date.now()).getMinutes());
        data.schedule.setSeconds(new Date(Date.now()).getSeconds());
        if($scope.projectUpdate.status !== $scope.project.status.toString())
            data.comment += '\n\n <b style="color:darkred">The status of the project has been changed from '
                +$rootScope.getCurrentStatus($scope.project.status)+
                ' to ' +
                $rootScope.getCurrentStatus($scope.projectUpdate.status)+'</b>';
        dataManager.saveData("projectComment","project comment saved", data);
    };

    $scope.$on('project comment saved',function(event,data){
        $scope.commentSubmit.saving = false;
        if(!data.success){
            $scope.projectUpdate.status = $scope.project.status.toString();
            alert(data.message);
        }else{
            $scope.comments.push(data.result);
            $scope.refreshCommentData();
            $scope.commentSubmit.contents = "";
            $scope.updateProject(data.result.schedule);
        }
    })

    $scope.$on('project info updated',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.project = data.result;
        }
    });

    $scope.$on('comments received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.comments =  data.result;
        }
    });

    $scope.initialize = function(){
        if($scope.currentPage === "comments")
            dataManager.requestData('projectComment','comments received',{populate:'user',search:{project:$scope.project._id},cond:{sort:{date:1}}});
        $scope.commentSubmit.user = "5e797da1b8859cb0fa0d29bd";
        $scope.refreshCommentData();
        $scope.projectUpdate.status = $scope.project.status.toString();
    }
});