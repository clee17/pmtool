app.controller("commentCon",function($scope,$rootScope,$location,$window,dataManager) {
    $scope.comments = [];
    $scope.contacts = [];
    $scope.attachIndex= 0;
    $scope.attachments = [];
    $scope.userInfo = $rootScope.user;
    $scope.page = 1;
    $scope.pageId = 1;
    $scope.maxCount = 1;
    $scope.requesting = true;

    $scope.goToCommentPage = function(index){
        if(index <= $scope.page && index >=1 ){
            $scope.pageId = index;
            $scope.reqeusting = true;
            dataManager.requestData('projectComment','comments received',{populate:'user attachments',search:{project:$rootScope.project._id},cond:{sort:{date:1},skip:35*($scope.pageId-1),limit:35}});
        }
    }


    $scope.setPageID = function(){
        $scope.page = Math.ceil($scope.maxCount / 35);
        $scope.startIndex = $scope.pageId - 7;
        if($scope.startIndex<1)
            $scope.startIndex = 1;
    }


    $scope.commentSubmit = {
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
        $scope.requesting = false;
        if(!data.success){
            alert(data.message);
        }else{
            $scope.maxCount = data.count;
            $scope.setPageID();
            for(let i=0;i<data.result.length;++i){
                if(!data.result[i])
                    data.result[i] = [];
            }
            $scope.comments =  data.result;
        }
    });

    $scope.$on('project info changed',function(event,data){
        $scope.refreshCommentData();
    });

    $scope.$on('project Updated',function(event,data){
        $scope.refreshCommentData();
    });

    $scope.refreshCommentData = function(){
        let element = document.getElementById('commentTime');
        if(!element)
            return;
        if(!$rootScope.project.schedule){
            element.value = "";
        }else{
            let schedule = new Date($rootScope.project.schedule);
            let year = schedule.getFullYear();
            let day = ("0" + schedule.getDate()).slice(-2);
            let month = ("0" + (schedule.getMonth() + 1)).slice(-2);
            element.value = year+'-'+month+'-'+day;
            $scope.scheduleNow = schedule;
        }
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
            let updateQuery = JSON.parse(JSON.stringify($rootScope.project));
            if(updateQuery.delivery)
                updateQuery.delivery = updateQuery.delivery._id;
            dataManager.saveData('project','project info updated', updateQuery);
        }
    }

    $scope.uploadAttach = function(){
        let upload = document.getElementById('attachUpload');
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
            index:$scope.attachIndex++,
            name:files[0].name,
            link:files[0].name,
            data:files[0]
        }
        $scope.attachments.push(newAttach);
        upload.outerHTML= upload.outerHTML;
    }

    $scope.deleteAttach = function(file){
         $scope.attachments.forEach(function(item,index){
             if(file.index == item.index){
                 $scope.attachments.splice(index,1);
                 return;
             }
         })
    };

    $scope.submitComment = function(){
        if($scope.commentSubmit.contents.length < 10){
            alert('评论内容不得少于10个字符');
            return;
        }
        $scope.commentSubmit.saving = true;
        let data = {
            date:new Date(Date.now()),
            comment: $scope.commentSubmit.contents,
            user: $rootScope.user._id,
            project:$rootScope.project._id
        };
        let element = document.getElementById('commentTime');
        if(element)
            data.schedule = element.value;
        if(data.schedule ==="")
            data.schedule = null;
        else
            data.schedule = new Date(data.schedule);
        data.status = Number($scope.projectUpdate.status);
        if(data.schedule && data.status === 7)
            data.status = 0;
        else if(data.status !== 7 && !data.schedule){
            data.schedule = Date.now();
        }
        data.populate = 'user attachments';
        let formData = new FormData();
        for(let i=0;i<$scope.attachments.length;++i){
            formData.append('file',$scope.attachments[i].data);
        }
        formData.append('saveRec',true);
        formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(data))));
        dataManager.uploadFile("/upload/attach/projectComment","project comment saved", formData);
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
            $scope.attachments.length = 0;
            let updateQuery = {
                populate: 'account',
                search:{_id:$rootScope.project._id},
                updateExpr:{
                    status:data.result.status,
                    schedule:data.result.schedule
                }
            }
            dataManager.saveData('project','project status updated', updateQuery);
        }
    })


    $scope.$on('contacts received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.contacts = data.result;
        }
    });

    $scope.$on('upload attach',function(event,data){

    });

    $scope.$on('project status updated',function(event,data){
        $rootScope.projectUpdating = false;
        if(!data.success)
            alert(data.message);
        else{
            $rootScope.project.status = data.result.status;
            $scope.projectUpdate.status = data.result.status.toString();
            $rootScope.project.schedule = data.result.schedule;
            $scope.refreshCommentData();
        }
    })

    $scope.initialize = function(){
        $scope.projectUpdate.status = $rootScope.project.status.toString();
        dataManager.requestData('projectComment','comments received',{populate:'user attachments',search:{project:$rootScope.project._id},cond:{sort:{date:1},skip:35*($scope.pageId-1),limit:35}});
        if($rootScope.project.account)
            dataManager.requestData('contacts','contacts received',{populate:'company',search:{company:$rootScope.project.account._id},cond:{sort:{name:1}}});
        else
            $scope.contacts = $rootScope.manangers;
        $scope.refreshCommentData();
    }

    $scope.initialize();
});