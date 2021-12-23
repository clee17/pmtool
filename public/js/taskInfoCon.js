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


app.directive('subTask',function($rootScope,$location){
    return{
        restrict:"EA",
        scope:{

        },
        link:function(scope,element,attr){
            element.css('display','inline-block');
            element.css('padding','5px');
            element.css('paddingLeft','7px');
            element.css('margin','5px');
            element.css('borderRadius','5px');
            element.css('position','relative');
            element.css('flex','1');
            element.css('marginLeft','5px');
            element.css('marginRight','4.5rem');
            element.css('background','rgba(205,205,205,0.3)');

            element
                .on('mouseenter',function(){
                    let children = element.children();
                    children[3].style.background = 'rgba(255,255,255,0.4)';
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    let children = element.children();
                    children[3].style.background = 'rgba(255,255,255,0)';
                    element.css('cursor','auto');
                })
                .on('click',function(){
                    let id = scope.$parent.line._id;
                    window.location.href = '/task/info?id='+ id;
                });
        }
    }
});

app.directive('commentType',function($rootScope,$location){
    return{
        restrict:"A",
        scope:{
            type:"@",
            usertype:"@",
        },
        link:function(scope,element,attr){
            let type = Number(scope.type);
            let usertype = Number(scope.usertype);
            element.css('padding','4px');
            element.css('marginLeft','1.5rem');
            element.css('marginRight','1.5rem');
            element.css('borderRadius','5px');
            let children = element.children();
            children[0].style.marginLeft = '5px';
            if(type === 11 && usertype === 2){
                element.css('background','yellow');
                element.css('color','black');
            }else if(type === 11){
                element.css('background','rgba(152,75,67,1)');
                element.css('color','white');

            }
        }
    }
});


app.directive('progressBar',function(){
    return{
        restrict:"A",
        scope: {
            progress:"@",
            id:"@"
        },
        link:function(scope,element, attr){
            let progress = JSON.parse(scope.progress);
            scope.refreshProgress = function(progress){
                if(progress<1)
                    progress = 1;
                else if(progress >100)
                    progress = 100;
                if(progress >= 100)
                    element.css('background','gray');
                else
                    element.css('background','lightgreen');
                element.css('zIndex','0');
                element.css('opacity','0.4');
                element.css('width',progress+'%');
            }

            scope.refreshProgress(progress);

            scope.$on('progress refreshed',function(event,data){
                if(scope.id === data._id)
                   scope.refreshProgress(data.progress);
            })
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

    $scope.completeTask = function(){
      if($rootScope.taskUpdating)
          return;
      $rootScope.taskUpdating = true;
      for(let i=0; i<$rootScope.task.children.length;++i){
          let task = $rootScope.task.children[i];
          if(task.progress < 100){
              $scope.$broadcast('alertMessage',{message:"因尚有sub task 没有完成，无法完成本任务。",type:1,height:'8rem',info:{message:'completeTask'}});
              return;
          }
      }
      $scope.$broadcast('alertMessage',{message:"Do you wish to complete this task?", height:'8rem',info:{message:'completeTask',type:5}});
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

    $rootScope.getDateStamp = function(){
        let element = document.getElementById('logTime');
        if(!element)
            return new Date(Date.now());
        let value = element.value;
        if(value === "" || !value)
            return new Date(Date.now())
        else
            return new Date(element.value);
    }
    $scope.refreshTime= function(sign,t){
        let element = document.getElementById(sign);
        if(!element)
            return;
        if(!t){
            element.value = "";
        }else{
            // let schedule = new Date($rootScope.task.schedule);
            let schedule = new Date(t);
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
        dataManager.requestData('tasks','task info received',{search:{_id:$rootScope.taskId},populate:'submitter parent children'});
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
            date:$rootScope.getDateStamp()
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
            date:$rootScope.getDateStamp()
        }
        if(data.type ===0){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:2},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:4,schedule:null,completed:new Date(Date.now())}, populate:'submitter parent children'});
        }else if(data.type ===1){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:2},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:0,completed:null}, populate:'submitter parent children'});
        }else if(data.type ===2){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:4},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{status:5,schedule:null}, populate:'submitter parent children'});
        }else if(data.type === 5){
            dataManager.saveData('taskComment', "task comment saved on index2",{search:search,updateExpr:{type:5},populate:'user attachments'});
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{progress:100}, populate:'submitter parent children'});
        }
    })

    $rootScope.updateProgress = function(){
        let parent = $rootScope.task.parent;
        for(let i =0; i< parent.length;++i){
            if(parent[i])
               dataManager.updateProgress(parent[i]._id);
        }
    }



    $scope.$on('task info received',function(event,data) {
        $scope.taskUpdating = false;
        $scope.tempSchedule = null;
        if(!data.success){
            if(data.message)
                alert(data.message);
        }else{
            let task = null;
            if(Array.isArray(data.result))
               task = data.result[0];
            else
                task = data.result;
            if($rootScope.task && $rootScope.task.progress <100 && task.progress >= 100){
                $rootScope.updateProgress();
            }
            if(!task)
                return;
            else
                $rootScope.task = task;
            $rootScope.taskStatus = $rootScope.task.status.toString();
            $rootScope.schedule = $rootScope.task.schedule;
            if($rootScope.schedule)
                $rootScope.schedule = new Date($rootScope.task.schedule);
            $scope.refreshBackground();
            $scope.refreshTime('logTime',Date.now());
            $scope.refreshTime('commentTime',$rootScope.task.schedule);
            $scope.refreshTaskBasic();
            $scope.refreshPage();
        }
    });

    $scope.$on('progress updated',function(eventd,data){
        if(!data.success){
            alert(data.message);
        }else{
            for(let i=0; i<$rootScope.task.parent.length;++i){
                let parent = $rootScope.task.parent[i];
                if(parent._id === data._id){
                    $rootScope.$broadcast('progress refreshed',{_id:parent._id,progress:data.progress});
                }
            }
            if($rootScope.task._id === data._id)
                $rootScope.task.progress = data.progress;
        }
    })
});

app.controller("infoCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.user = $rootScope.user;
    $scope.userType = 0; //default a PM user.
    $scope.manHour = 0;
    $scope.engineer = null;
    $scope.engineers = [];
    $scope.addingComment = false;
    $scope.addingDesc = false;
    $scope.commentPage = {
        page:1,
        pageId:1,
        startIndex:1,
        maxCount:0
    };

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

    $scope.setPageID = function(){
        $rootScope.commentPage.page = Math.ceil( $rootScope.commentPage.maxCount / 35);
        $rootScope.commentPage.startIndex = $scope.pageId - 7;
        if( $rootScope.commentPage.startIndex<1)
            $rootScope.commentPage.startIndex = 1;
    }

    $scope.goToCommentPage = function(index){
        if(index <= $scope.commentPage.maxPage && index >=1 ){
            $scope.commentPage.pageId = index;
            $scope.reqeusting = true;
            dataManager.requestData('taskComment','comments received',{populate:'user attachments',search:{task:$rootScope.taskId},cond:{sort:{date:1},skip:35*($scope.commentPage.pageId-1),limit:35}});
        }
    }

    $scope.addParentTask = function(){
        $rootScope.$broadcast('newTask',{type:0,mode:0});
    }

    $scope.addChildTask = function(){
        $rootScope.$broadcast('newTask',{type:1,mode:0});
    };

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



    $scope.switchUserType = function(type){
        $scope.userType = type;
        console.log('type should be switched');
    }

    $scope.submitComment = function(index,parent){
        let contents = $scope.comment[index.toString()];
        if(!contents || contents.length< 10){
            alert('评论内容不得少于10个字符');
            return;
        }
        if($scope.userType === 1 && !$scope.engineer){
            alert("增加工程师记录不能工程师为空");
            return;
        }else if($scope.userType === 1 && $scope.manHour ===0){
            alert("增加工程师记录人时不能为空");
            return;
        }
        $scope.saving[index.toString()].saving = true;

        let data = {
            search:{
                date:$rootScope.getDateStamp(),
                status:$scope.status,
                type:index,
                comment: contents,
                user: $rootScope.user._id,
                task:$rootScope.taskId,
                hours:$scope.manHour
            },
            populate:'user attachments',
            updateExpr:{
                attachments:[],
            },
            info: {index:index},
        };

        data.search.user = $scope.userType? $scope.engineer : $rootScope.user._id;
        if($scope.userType)
           data.search.type = 10 + index;

        let element = document.getElementById('commentTime');
        if(element)
            $scope.tempSchedule = new Date(element.value);
        element = document.getElementById('logTime');
        if(element)
            $scope.date = new Date(element.value);
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
            if($scope.commentPage.pageId >= $scope.commentPage.maxPage)
                $scope.comments.push(data.result);
            $scope.commentPage.maxCount++;
            $scope.commentPage.maxPage = Math.ceil(data.maxCount/20);
            $scope.comment['1'] = "";
            $scope.attachments['1'].length = 0;
            if($scope.status === '5'){
                $scope.status = '0';
                if(!$scope.tempSchedule)
                    $scope.tempSchedule = Date.now();
            }
            let manHour = $rootScope.task.hours;
            manHour += data.result.hours;
            dataManager.updateData('tasks',"task info received",{search:{_id:$rootScope.taskId},updateExpr:{schedule:$scope.tempSchedule,status:Number($scope.status),hours:manHour},populate:'submitter'});
        }
    });

    $scope.$on('task comment saved on index2',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.stringifyData(data.result);
            if($scope.commentPage.pageId >= $scope.commentPage.maxPage)
                $scope.comments.push(data.result);
            $scope.commentPage.maxCount++;
            $scope.commentPage.maxPage = Math.ceil(data.maxCount/20);
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
        }else if(rec.type === 5){
            rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> <b style='color:green;'>complete </b>the task on <b>"+current+"</b>";
        }else if(rec.type === 6 || 7){// change type 6 + change estimation 7
        }

    }

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $scope.commentPage.maxCount = data.maxCount;
            $scope.commentPage.maxPage = Math.ceil(data.maxCount/35);
            console.log($scope.commentPage);
        }else
            alert("countReceived"+data.message);
    });


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
            $rootScope.task = task;
            $scope.status = task.status.toString();
        }
    });

    $scope.$on('engineers received',function(event,data){
        if(data.success)
            $scope.engineers = data.result;
        else{
            $scope.engineers = [];
            alert(data.message);
        }
    });

    $scope.initialize = function(){
        dataManager.requestData('taskComment','comments received',{populate:'user attachments',search:{task:$rootScope.taskId},cond:{sort:{date:1},skip:35*($scope.commentPage.pageId-1),limit:35}});
        dataManager.countPage('taskComment',{search:{task:$rootScope.taskId}});
        dataManager.requestData('user','engineers received',{search:{type:{$in:[1,2]}}});
        $scope.refreshTime('logTime',Date.now());
    }

    $scope.initialize();
});

app.controller("coverCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.answering = false;
    $scope.infoType = 0;
    $scope.answerAlert = function(result){
        $scope.answering = false;
        if(result){
            $scope.$emit('alertConfirmed',$scope.info);
            $scope.info = null;
            cancelDoc();
        }else{
            $rootScope.taskUpdating = false;
            cancelDoc();
        }
    };

    $scope.showBoard = function(width,height){
        let topLayer = document.getElementById('pageCover');
        if(topLayer)
            topLayer.style.display = 'flex';

        setTimeout(function() {
            let element = document.getElementById("infoBoard");
            if(element)
                element.style.height = height || '15rem';
            element.style.minWidth = width || '20rem';
        },10);
    }

    $scope.$on('newTask',function(event,data){
        $scope.infoType = 1;
        data.showBoard = $scope.showBoard;
        $scope.$broadcast('newTaskBoard',data);
    })

    $scope.$on('alertMessage',function(event,data){
        if($scope.answering)
            return;
        let element = document.getElementById("alertTaskInfo");
        if(!element)
            return;
        $scope.infoType = 0;
        element.innerHTML = data.message;
        element = document.getElementById('alertTaskButton');
        if(!element)
            return;
        let buttons = element.children;
        buttons[0].style.display = data.type? 'none':'auto';
        buttons[1].style.display = data.type? 'none':'auto';
        buttons[2].style.display = data.type? 'auto':'none';

        $scope.info = data.info;
        $scope.answering = true;

        $scope.showBoard('35rem',data.height);

    })
});

app.controller("newTaskCon",function($scope,$rootScope,$location,$window,dataManager) {
    $scope.mode = 0;
    $scope.type = 0; //parent or children
    $scope.status = 0;
    $scope.existedTasks = [];
    $scope.showBoard = null;
    $scope.taskId = "";

    $scope.initialize = function(mode,type){
        $scope.taskId = "";
        $scope.mode = mode;
        $scope.type = type;
        $scope.switchMode($scope.mode);
    }

    $scope.switchMode = function(newMode){
        $scope.mode = newMode;
        $scope.status = 0;
        $scope.existedTasks = [];
        if(newMode ===1){
            if($scope.showBoard)
                $scope.showBoard('45rem','35rem');
        }else if(newMode===0){
            if($scope.showBoard)
                $scope.showBoard('45rem','15rem');
        }
    }

    $scope.searchTask = function(){
        if($scope.status===2)
            return;
        let id = $scope.taskId;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            alert("please provide an valid id");
            return;
        }
        $scope.status = 2;
        dataManager.requestData('tasks','searchTask received',{populate:'project account',search:{_id:id},cond:{limit:1}});
    }

    $scope.addRelatedTask = function(){
        if($scope.existedTasks.length ===0){
            alert("please search again");
            return;
        }
        if($scope.existedTasks[0]._id === $rootScope.task._id){
            alert("cannot add the task itself as a related task.")
            return;
        }else if($scope.type===1){
            for(let i=0; i<$rootScope.task.parent.length;++i){
               let parent = $rootScope.task.parent[i];
               if(parent._id === $scope.taskId){
                   alert("cannot add parent task as child task");
                   return;
               }
            }
        }else if($scope.type ===0){
            for(let i=0; i<$rootScope.task.children.length;++i){
                let child = $rootScope.task.children[i];
                if(child._id === $scope.taskId){
                    alert("cannot add child task as parent task");
                    return;
                }
            }
        }

        $scope.status = 2;
        let searchCon = {_id:$rootScope.task._id};
        if($scope.type)
            searchCon.children = $scope.taskId;
        else
            searchCon.parent = $scope.taskId;
        dataManager.requestData('tasks','no duplicate task',{search:searchCon});

    }

    $scope.addParentTask = function(){
        dataManager.updateData('tasks',"related task updated",{search:{_id:$rootScope.taskId},updateExpr:{$push: {parent:$scope.taskId}}, populate:'parent'});
    }

    $scope.addChildTask = function(){
        dataManager.updateData('tasks',"related task updated",{search:{_id:$rootScope.taskId},updateExpr:{$push: {children:$scope.taskId}}, populate:'children'});

    }

    $scope.$on('no duplicate task',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            if(data.result.length >0){
                $scope.status = 4;
                alert("the target task already existed");
                return;
            }
            if($scope.type){
                $scope.addChildTask();
            }else{
                $scope.addParentTask();
            }
        }
    })

    $scope.$on('related task updated',function(event,data){
         $scope.status = 4;
        if(!data.success){
            alert(data.message);
        } else{

            if($scope.type){
                $rootScope.task.children = data.result.children;
                dataManager.updateData('tasks',"related tasks updated 2 ",{search:{_id:$scope.taskId},updateExpr:{$push: {parent:$rootScope.task._id}}});
                dataManager.updateProgress($rootScope.task._id);
            }else{
                $rootScope.task.parent = data.result.parent;
                dataManager.updateData('tasks',"related tasks updated 2 ",{search:{_id:$scope.taskId},updateExpr:{$push: {children:$rootScope.task._id}}});
                $rootScope.updateProgress();
            }

            $scope.status = 1;
            $scope.existedTasks = [];
            $scope.taskId = "";
        }
    })


    $scope.$on('searchTask received',function(event,data){
        $scope.status = 1;
        if(data.success){
            $scope.status = 4;
            $scope.existedTasks = [];
            $scope.existedTasks = $scope.existedTasks.concat(data.result);
        }else{
            alert(data.message);
        }
    })

    $scope.$on('newTaskBoard',function(event,data){
        $scope.showBoard = data.showBoard;
        $scope.initialize(data.mode,data.type);
    })

    $scope.$watch("taskId",function(oldVal,newVal){
        $scope.status = 1;
        $scope.existedTasks = [];
    })
});