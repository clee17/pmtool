app.controller("pwdCon",function($scope,$rootScope,dataManager,$window){
    $scope.user = "";
    $scope.pwd = "";
    $scope.users = [];
    $scope.success = true;
    $scope.resetError = function(){
        $scope.error="";
    }

    $scope.$watch('user',function(oldVal,newVal){
        $scope.success = false;
    });

    $scope.$watch('pwd',function(newVal,oldVal){
        if($scope.newVal === "" && $scope.oldVal !== "")
            $scope.error = "The password cannot be empty";
        else if(newVal.length >0 && newVal.length <=6)
            $scope.error = "The password must be at least 6 digit";
        else if(newVal.length >0 && newVal.match(/\\s/))
            $scope.error = "The password cannot contain space";
        else
            $scope.error = "";
    });

    $scope.$watch('error',function(newVal,old){
        let ele = document.getElementById('information');
        if(newVal !== "")
            ele.style.opacity = '100';
        else
            ele.style.opacity = '0';
    });

    $scope.resetData = function(){
        let ele = document.getElementById('input');
        if(ele)
            ele.value = "";
    };

    $scope.reset = function(){
        if($scope.error.length)
            return;
        $scope.success = false;
        if($scope.user === "0")
            alert('There is something wrong, please referesh the page');
        else
            dataManager.request('/pwdReset/','pwd reset finish',{user:$scope.user,pwd:md5($scope.pwd)});
    }

    $scope.$on('pwd reset finish',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.success = true;
            $scope.resetError();
            $scope.resetData();
        }
    });

    $scope.$on('users received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.users = data.result;
            $scope.user = data.result.length >0? data.result[0]._id : "0";
            if(!data.result.length)
                $scope.users = [{_id:"0",name:"Something is wrong when asking for the users data"}];
        }
    });


    $scope.initialize = function(){
        dataManager.requestData('user','users received',{search:{title:'Program Manager'},cond:{sort:{name:1}}});
    }

    $scope.resetError();
    $scope.initialize();
});