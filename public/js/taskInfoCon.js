app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.create = new Date(JSON.parse(decodeURIComponent(scope.createdAt)));
            $rootScope.schedule = new Date(JSON.parse(decodeURIComponent(scope.schedule)));
            $rootScope.user = JSON.parse(decodeURIComponent(scope.user));
            $rootScope.taskId = scope.id;
            $rootScope.taskStatus = scope.status;
            $rootScope.initialize();
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


app.filter('taskStatus',function(){
    return function(status){
        if(status === 0)
            return 'Review & QA';
        else if (status === 1)
            return 'Engineer Assigned';
        else if (status === 2)
            return 'Verification';
        else if (status === 3)
            return 'Pending';
        else if (status === 4)
            return 'Closed';
    }
});

app.controller("rootCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.addDescription = [];
    $rootScope.maxCount = 0;
    $rootScope.commentPage = {
        page:1,
        pageId:1,
        startIndex:1,
        maxCount:0
    };

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

    $scope.refreshCommentData = function(){
        let schedule = $rootScope.schedule;
        let day = ("0" + schedule.getDate()).slice(-2);
        let month = ("0" + (schedule.getMonth() + 1)).slice(-2);
        let element = document.getElementById('commentTime');
        if(element)
            element.value = schedule.getFullYear()+'-'+(month)+'-'+day;
    }

    $rootScope.initialize = function(){
        dataManager.requestData('tasks','task info received',{search:{_id:$rootScope.taskId},populate:'submitter'});
        dataManager.countPage('taskComment', {parent:null,type:1,task:$rootScope.taskId});
        $scope.refreshCommentData();
    }

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $rootScope.commentPage.maxCount = data.maxCount;
            $rootScope.commentPage.maxPage = Math.ceil(data.maxCount/20);
        }else
            alert("countReceived"+data.message);
    });

    $scope.$on('task info received',function(event,data) {
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.task = data.result;
        }
    });

});

app.controller("infoCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.user = $rootScope.user;
    $scope.addingComment = false;
    $scope.addingDesc = false;

    $scope.attachIndex= 0;

    $scope.comments = [];

    $scope.comment = {
        '0':"",
        '1':""
    }

    $scope.attachments = {
        '0':[],
        '1':[]
    }

    $scope.attachIndex = {
        '0':0,
        '1':0,
    }

    $scope.saving = {
        '0':$scope.addingDesc,
        '1':$scope.addingComment
    };
    $scope.description = {};
    $scope.status = $rootScope.taskStatus;

    $scope.switchAddDesc = function(){
        $scope.addingDesc = !$scope.addingDesc;
    }

    $scope.updatable  = function(index){
        if(!$scope.addingComment){
            if(index === 0)
                return !$scope.addingDesc;
            else
                return true;
        }else{
            return false;
        }
    }

    $scope.uploadAttach = function(index,parent,description){
        let id = 'attachUpload'+index;
        let upload = document.getElementById(id);
        if(!upload)
            return;
        let files = [];
        if(upload && upload.files)
            files = upload.files;
        if(files.length<=0){
            alert('to upload an attachment, you must select a file');
            return;
        }
        let newAttach = {
            parent:parent,
            index:$scope.attachIndex[index.toString()]++,
            name:files[0].name,
            link:files[0].name,
            data:files[0],
            queueIndex: index,
        }
        if (!$scope.attachments[index.toString()])
            $scope.attachments[index.toString()] = [];

        $scope.attachments[index.toString()].push(newAttach);
        upload.outerHTML= upload.outerHTML;
    }

    $scope.setPageID = function(){
        $rootScope.commentPage.page = Math.ceil( $rootScope.commentPage.maxCount / 35);
        $rootScope.commentPage.startIndex = $scope.pageId - 7;
        if( $rootScope.commentPage.startIndex<1)
            $rootScope.commentPage.startIndex = 1;
    }

    $scope.goToCommentPage = function(index){
        if(index <= $scope.page && index >=1 ){
            $rootScope.commentPage.pageId = index;
            $scope.reqeusting = true;
            dataManager.requestData('taskComment','comments received',{populate:'user attachments',search:{task:$rootScope.taskId},cond:{sort:{date:1},skip:35*($rootScope.commentPage.pageId-1),limit:35}});
        }
    }

    $scope.submitComment = function(index,parent){
        let contents = $scope.comment[index.toString()];
        if(!contents || contents.length< 10){
            alert('评论内容不得少于10个字符');
            return;
        }
        $scope.saving[index.toString()].saving = true;

        let data = {
            search:{
                date:new Date(Date.now()),
                parent:parent,
                status:$rootScope.taskStatus,
                type:index,
                comment: contents,
                user: $rootScope.user._id,
                task:$rootScope.taskId
            },
            populate:'user attachments',
            updateExpr:{
                attachments:[],
            },
            info: {index:index},
        };

        let element = document.getElementById('commentTime');
        if(element)
            $scope.tempSchedule = new Date(element.value);
        let formData = new FormData();
        let attachments = $scope.attachments[index.toString()];
        for(let i=0;i<attachments.length;++i){
            formData.append('file',attachments[i].data);
        }
        formData.append('saveRec',true);
        formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(data))));
        formData.append('queue',index);
        dataManager.uploadFile("/upload/attach/taskComment","task comment saved on index"+ index, formData);
    }

    $scope.$on('task comment saved on index1',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.comments.push(data.result);
            $scope.comment['1'] = "";
            $scope.attachments['1'].length = 0;
            dataManager.updateData('tasks',"task info updated",{search:{_id:$rootScope.taskId},updateExpr:{schedule:$scope.tempSchedule,status:Number($scope.status)}});
        }
    });


    $scope.$on('task info updated',function(event,data){
        $scope.tempSchedule = null;
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.taskStatus = $scope.status;
            $rootScope.schedule = new Date(data.result.schedule);
            $scope.refreshCommentData();
        }
    });


    $scope.$on("comments received",function(event,data){
        if(!data.success)
            alert(data.message);
        else
           $scope.comments = data.result;
    })

    $scope.initialize = function(){
        dataManager.requestData('taskComment','comments received',{populate:'user attachments',search:{task:$rootScope.taskId},cond:{sort:{date:1},skip:35*($rootScope.commentPage.pageId-1),limit:35}});
    }

    $scope.initialize();
});