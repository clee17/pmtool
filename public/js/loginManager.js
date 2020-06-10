var changePwd = function() {
    let value = "";
    let ele = document.getElementById('input');
    if(ele && ele.value.length >0)
       value = md5(ele.value);
    else
        value = "";
    let shadowEle = document.getElementById('shadow');
    shadowEle.value = value;
}

app.controller("loginCon",function($scope,$rootScope,dataManager,$window){
    $scope.username = "";
    $scope.resetError = function(){
        $scope.errorMessage = {
            user:"",
            pwd:""
        };
    }

   var isError = function(){
        for(let attr in $scope.errorMessage){
            if($scope.errorMessage[attr] !== "")
                return true;
        }
        return false;
    }

    $scope.sendLogin = function(){
        let ele = document.getElementById('shadow');
        let pwd = ele? ele.value: "";
        if($scope.username === "")
            $scope.errorMessage.user = "invalid username";
        if(pwd === "")
            $scope.errorMessage.pwd = "please type your password";
        if(isError())
            return;
        let info = {
            username:$scope.username,
            cre:pwd
        }
        $scope.resetError();
        dataManager.requestLogin(info);
    }

    $scope.$on('loginComplete',function(event,data){
        if(!data.success){
            alert(data.message);
            $scope.resetError();
        }else{
            console.log(data.message);
            $window.location.reload();
        }
    });

    $scope.resetError();
});