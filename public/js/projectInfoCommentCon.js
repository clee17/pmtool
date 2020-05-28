app.controller("commentCon",function($scope,$rootScope,$location,$window,dataManager) {
    $scope.comments = [];
    $scope.contacts = [];
    $scope.pageId= 1;
    $scope.maxCount = 1;
    $scope.gotoPage = function(index){
        if(index <= page && index >=1 ){
            $scope.pageId = index;
            dataManager.requestData('projectComment','comments received',{populate:'user',search:{project:$rootScope.project._id},cond:{sort:{date:1},skip:35*$scope.pid-1,limit:35}});
        }
    }


    $scope.setPageID = function(){
        $scope.page = Math.ceil($scope.maxCount / 35);
        $scope.startIndex = $scope.pageId - 7;
        if($scope.startIndex<1)
            $scope.startIndex = 1;
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
        return $rootScope.project.status !== 5 && !$scope.commentSubmit.saving;
    }

    $scope.$on('comments received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.maxCount = data.count;
            $scope.setPageID();
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
            let updateQuery = JSON.parse(JSON.stringify($rootScope.project));
            if(updateQuery.delivery)
                updateQuery.delivery = updateQuery.delivery._id;
            dataManager.saveData('project','project info updated', updateQuery);
        }
    }


    $scope.submitComment = function(){
        if($scope.commentSubmit.contents.length < 10){
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
        dataManager.requestData('projectComment','comments received',{populate:'user',search:{project:$rootScope.project._id},cond:{sort:{date:1},skip:35*$scope.pid-1,limit:35}});
        if($rootScope.project.account)
            dataManager.requestData('contacts','contacts received',{populate:'company',search:{company:$rootScope.project.account._id},cond:{sort:{name:1}}});
        else
            $scope.contacts = $rootScope.manangers;
        $scope.commentSubmit.user = "5e797da1b8859cb0fa0d29bd";
        $scope.refreshCommentData();
    }

    $scope.initialize();
});