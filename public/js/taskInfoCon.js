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


app.filter('buttonStatus',function(){
    return function(status){
        if(status === 4)
            return 'OPEN';
        else
            return 'CLOSE';
    }
})

app.controller("rootCon",function($scope,$rootScope,$location,$window,$filter,dataManager){
    $scope.addDescription = [];
    $rootScope.maxCount = 0;
    $rootScope.commentPage = {
        page:1,
        pageId:1,
        startIndex:1,
        maxCount:0
    };

    $scope.closeTask = function(){
        if($rootScope.taskUpdating)
            return;
        $rootScope.taskUpdating = true;
        if($rootScope.task.status === 4){
            $scope.$broadcast('alertMessage',{message:"是否重开此任务?",info:{message:'openTask',type:1}});
        }else{
            $scope.$broadcast('alertMessage',{message:"是否确认关闭本任务?",info:{message:'closeTask',type:0}});
        }
    };

    $scope.pendTask = function(){
        if($rootScope.taskUpdating)
            return;
        $rootScope.taskUpdating = true;
        $scope.$broadcast('alertMessage',{message:"是否确认挂起本任务?",info:{message:'pendTask',type:2}});
    }

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
        let element = document.getElementById('commentTime');
        if(!element)
            return;
        if(!$rootScope.task.schedule){
            element.value = "";
        }else{
            let schedule = new Date($rootScope.task.schedule);
            let year = schedule.getFullYear();
            let day = ("0" + schedule.getDate()).slice(-2);
            let month = ("0" + (schedule.getMonth() + 1)).slice(-2);
            element.value = year+'-'+month+'-'+day;
        }
    }

    $scope.refreshTaskBasic  = function(){
        let element = document.getElementById('description');
        if(element)
            element.innerHTML = $filter('contentFormat')($rootScope.task.description);
    }

    $scope.refreshBackground = function(){
        let element = document.getElementById("mainContents_0");
        if(!element)
            return;
        if($rootScope.task.status === 4){
            element.style.background ="rgba(235,235,235,1)";
        }else{
            element.style.background = "rgba(255,255,255,1)";
        }
    }

    $scope.refreshPage = function(){
        dataManager.countPage('taskComment', {task:$rootScope.taskId});
    }

    $rootScope.initialize = function(){
        dataManager.requestData('tasks','task info received',{search:{_id:$rootScope.taskId},populate:'submitter'});
        $scope.refreshPage();
    }

    $scope.updateTaskDescription = function(value){
        if($scope.taskUpdating)
            return;
        $scope.taskUpdating = true;
        let search = {
            status:$rootScope.task.status,
            task:$rootScope.taskId,
            user:$rootScope.user._id,
            date:Date.now()
        }
        dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:3,comment:$rootScope.task.comment},populate:'user attachments'});
        dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{description:value}, populate:'submitter'});
    }

    $scope.submitDescription = function(){
        let element = document.getElementById("descriptionBox");
        if(!element)
            return;
        if(element.value === $rootScope.task.description){
            $scope.$broadcast("task info received",{success:false});
        }else{
            $scope.updateTaskDescription(element.value);
        }

    };

    $scope.$on('alertConfirmed',function(event,data){
        let search = {
            status:$rootScope.task.status,
            task:$rootScope.taskId,
            user:$rootScope.user._id,
            date:Date.now()
        }
        if(data.type ===0){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:2},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:4,schedule:null}, populate:'submitter'});
        }else if(data.type ===1){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:2},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:0}, populate:'submitter'});
        }else if(data.type ===2){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:4},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:5,schedule:null}, populate:'submitter'});
        }
    })

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $rootScope.commentPage.maxCount = data.maxCount;
            $rootScope.commentPage.maxPage = Math.ceil(data.maxCount/20);
        }else
            alert("countReceived"+data.message);
    });

    $scope.$on('task info received',function(event,data) {
        $scope.taskUpdating = false;
        $scope.tempSchedule = null;
        if(!data.success){
            if(data.message)
                alert(data.message);
        }else{
            if(Array.isArray(data.result))
                $rootScope.task = data.result[0];
            else
                $rootScope.task = data.result;
            $rootScope.taskStatus = $rootScope.task.status.toString();
            $rootScope.schedule = $rootScope.task.schedule;
            if($rootScope.schedule)
                $rootScope.schedule = new Date($rootScope.task.schedule);
            $scope.refreshBackground();
            $scope.refreshCommentData();
            $scope.refreshTaskBasic();
            $scope.refreshPage();
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
        if($scope.addingDesc)
        {
            let element = document.getElementById("descriptionBox");
            if(element)
                element.value = $rootScope.task.description;
        }
    }

    $scope.updatable  = function(index){
        if(!$rootScope.task || $rootScope.task.status === 4)
            return false;
        if(!$scope.addingComment){
            if(index === 0)
                return !$scope.addingDesc;
            else
                return true;
        }else{
            return false;
        }
    }

    $scope.deleteAttach = function(attach,index){
        let attachments = $scope.attachments[index.toString()];
        if(!attachments)
            return;
        for(let i=0; i<attachments.length;++i){
            if(attachments[i].index === attach.index){
                attachments.splice(i,1);
                break;
            }
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
                status:$scope.status,
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
            if($scope.status === '5'){
                $scope.status = '0';
                if(!$scope.tempSchedule)
                    $scope.tempSchedule = Date.now();
            }
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{schedule:$scope.tempSchedule,status:Number($scope.status)},populate:'submitter'});
        }
    });

    $scope.$on('task comment saved on index2',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.stringifyData(data.result);
            $scope.comments.push(data.result);
        }
    });

    $scope.stringifyData = function(rec){
        let current = new Date(rec.date);
        current = current.getFullYear() + '/' + (current.getMonth()+1) + '/' + current.getDate();
        if(rec.type === 2){
            if(rec.status === 4){
                rec.comment = '<b style="color:rgba(152,75,67,1)">'+ rec.user.name + "</b> reopened the task on <b>"+current+"</b>" ;
            }else{
                rec.comment = '<b style="color:rgba(152,75,67,1)">'+ rec.user.name + "</b> closed the task on <b>"+current+"</b>";
            }
        }else if(rec.type === 3){
            rec.description = rec.comment;
            rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> changed the desciption on <b>"+current+"</b>" ;
        }else if(rec.type === 4){
            rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> <b>hang </b>the task on <b>"+current+"</b>" ;
        }

    }


    $scope.$on("comments received",function(event,data){
        if(!data.success)
            alert(data.message);
        else{
            for(let i=0; i<data.result.length;++i) {
                if(data.result[i].type >=2){
                    $scope.stringifyData(data.result[i]);
                }
            }
            $scope.comments = data.result;
        }

    })

    $scope.$on('task info received',function(event,data){
        if($scope.addingDesc){
            $scope.switchAddDesc();
        }
        if(data.success){
            let task = null;
            if(Array.isArray(data.result))
               task = data.result[0];
            else
                task = data.result;
            $scope.status = task.status.toString();
        }
    });

    $scope.initialize = function(){
        dataManager.requestData('taskComment','comments received',{populate:'user attachments',search:{task:$rootScope.taskId},cond:{sort:{date:1},skip:35*($rootScope.commentPage.pageId-1),limit:35}});
    }

    $scope.initialize();
});

app.controller("coverCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.answering = false;
    $scope.answerAlert = function(result){
        $scope.answering = false;
        if(result){
            $scope.$emit('alertConfirmed',$scope.info);
            $scope.info = null;
            cancelDoc();
        }else{
            if($scope.info.type === 0)
                $rootScope.taskUpdating = false;
            cancelDoc();
        }
    };

    $scope.$on('alertMessage',function(event,data){
        if($scope.answering)
            return;
        let element = document.getElementById("alertTaskInfo");
        if(!element)
            return;
        element.innerHTML = data.message;

        $scope.info = data.info;
        $scope.answering = true;

        let topLayer = document.getElementById('pageCover');
        if(topLayer)
            topLayer.style.display = 'flex';

        setTimeout(function() {
            let element = document.getElementById("infoBoard");
            if(element)
              element.style.height = '15rem';
              element.style.minWidth = '35rem';
            },10);
    })
});