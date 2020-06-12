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

    manager.uploadFile = function(url,symbol,data){
        $http.post(url,data, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    $rootScope.$broadcast(symbol,receivedData);
            },
                function(err){
                    $rootScope.$broadcast(symbol,{success:false,info:err});
                });
    };

    manager.requestLogin = function(info){
        manager.request('/login/',"loginComplete",info);
    }

    manager.vagueSearch = function(tableId,value){
        manager.request('/vagueSearch/',"vagueSearchFinished",{index:tableId,value:value});
    };

    manager.requestProject = function(){
        manager.request('/getInfo/project',"dataReceived",{index:"project"});
    };

    manager.requestData = function(tableName,symbol,data){
        manager.request('/search/'+tableName,symbol,data);
    }

    manager.requestAggregateData = function(tableName,symbol,data){
        manager.request('/aggregate/'+tableName,symbol,data);

    }

    manager.saveData = function(tableName,symbol,data){
        manager.request('/save/'+tableName,symbol,data);
    }

    manager.updateData = function(tableName,symbol,data){
        manager.request('/save/'+tableName,symbol,data);
    }
});