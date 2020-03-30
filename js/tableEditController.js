app.service("dataManager",function($http,$rootScope){
    let manager = this;

    manager.request = function(url,symbol,data){
        $http.post(url,{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                $rootScope.$broadcast(symbol,receivedData);
            },
            function(err){
                $rootScope.$broadcast(symbol,{success:false,info:err});
            });
    };

    manager.countPage = function(tableId){
        manager.request('/countInfo/',"countReceived",{index:tableId});
    };

    manager.requestDevelopers = function(){
        manager.request('/getInfo/developers',"dataReceived",{index:"developers"});
    };
});

app.filter('language',function(){
    return function(language){
        console.log(language);
        if(language === 0)
            return 'EN';
        else if(language === 1)
            return 'CN';
        else if(language === 2)
            return 'JP';
        else if (language === 3)
            return 'IT';
    }
});

app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.contents = JSON.parse(scope.contents);
            scope.initialize();
        }
    }
});

app.controller("tableEditCon",function($scope,dataManager,$location,$window){
    $scope.dateNow = Date.now();
    $scope.customers = [
    ];
    $scope.contacts = [];
    $scope.developers = [];
    $scope.products = [];
    $scope.suppliers = [];

    $scope.pageIndex = {
        startIndex:1,
        pageMax:1,
        pageId:$location.search().pid || 1,
        gotoPage:function(index){
            $location.search('pid',index.toString());
            $window.location.href = $location.absUrl();
        }
    };

    $scope.userAdd = {
        title:"0",
        department:"0",
        name:"",
        nameCN:"",
        number:-1,
        mail:"",
        location:"0"
    };

    $scope.add = {
        customer:null,
        priority:"0",
        contacts:"",
        developer:"",
        product:"",
        status:"0",
        supply:""
    };

    $scope.$on('dataReceived',function(event,data){
        if(data.success && $scope[data.index]){
            $scope[data.index] = JSON.parse(JSON.stringify(data.result));
        }
        else
            alert(data.message);
    });

    $scope.$on('countReceived',function(event,data){
         if(data.success){
              $scope.pageIndex.pageMax = Math.ceil(data.maxCount/30);
         }else
             alert(data.message);
    });

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        $scope.initialized = true;
        $scope.countPage = dataManager.countPage($scope.tableId);
        dataManager.requestDevelopers();
    };
});