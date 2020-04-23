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

    manager.vagueSearch = function(tableId,value){
        manager.request('/vagueSearch/',"vagueSearchFinished",{index:tableId,value:value});
    };

    manager.requestDevelopers = function(){
        manager.request('/getInfo/developers',"dataReceived",{index:"developers"});
    };

    manager.requestProducts = function(condition){
        manager.request('/getInfo/products','dataReceived',{index:"products",condition:condition});
    };
});

app.filter('language',function(){
    return function(language){
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

app.controller("tableEditCon",function($scope,$rootScope,dataManager,$location,$window){
    $scope.dateNow = Date.now();
    $scope.customers = [
    ];
    $scope.developers = [];
    $scope.products = [];
    $scope.suppliers = [];

    window.addEventListener("click",function(event){
        if($rootScope._buttonClicked)
            $rootScope._buttonClicked = false;
        else
            $rootScope.$broadcast("clicked",{event:event});
    });

    $scope.pageIndex = {
        startIndex:1,
        pageMax:1,
        pageId:$location.search().pid || 1,
        gotoPage:function(index){
            $location.search('pid',index.toString());
            $window.location.href = $location.absUrl();
        }
    };

    $scope.vagueSearch = '';
    $scope.vagueValue = [];
    $scope.checkInfo = function(value,symbol,info){
        $scope.vagueSearch = symbol;
        if(value === ""){
            info = null;
            return;
        }
        dataManager.vagueSearch(symbol,value);
    };

    $scope.clearVague = function(event){
        $scope.vagueFinished = true;
    };


    $scope.selectVague = function(rootValue,attr,valueInfo,value){
        $scope.vagueValue = [];
        $scope[rootValue][attr] = value;
        $scope[rootValue][attr+'Info'] = valueInfo;
    };

    $scope.pushValue = function(value,arr){
        for(let i=0; i<arr.length;++i){
            if(arr[i].name === value.name && arr[i].mail === value.mail){
                alert('不可重复添加');
                return false;
            }
        }
        if(value)
           arr.push(value);
    };

    $scope.deleteItem = function(index,arr){
        arr.splice(index,1);
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
        name:"",
        customer:"",
        customerInfo:null,
        priority:"0",
        contact:"",
        contactInfo:null,
        contacts:[],
        developer:null,
        developers:[],
        product:null,
        products:[],
        status:"0",
        supply:""
    };

    $scope.couldAddProject = function(){

    }

    $scope.addProject = function(){
        let add = $scope.add;
       if(!add.customerInfo){
            alert('请重新输入客户信息');
            return;
        }else if(add.contacts.length === 0){
           alert('请输入联系人');
           return;
       }else if(add.products.length ===0){
           alert('不能没有产品');
           return;
       }

       let newProject = {};
       newProject.name = add.name;
       newProject.account = add.customerInfo._id;
       newProject.priority = Number(add.priority);
       newProject.contacts = add.contacts.map(function(item){
           return item._id;
       });
       newProject.developers = add.developers.map(function(item){
           return item._id;
       });
       newProject.products = add.products.map(function(item){
           return item._id;
       })
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

    $scope.$on('vagueSearchFinished',function(event,data){
         if(data.success){
             $scope.vagueValue = data.result;
         }else
             alert(data.message);
    });

    $scope.$on("clicked",function(event,data){
        if($scope.vagueFinished === true){
            $scope.vagueFinished = false;
            $scope.vagueSearch = "";
            $scope.vagueValue = [];
        }
    });

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        $scope.initialized = true;
        $scope.countPage = dataManager.countPage($scope.tableId);
        dataManager.requestDevelopers();
        dataManager.requestProducts();
    };
});