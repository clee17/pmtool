app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.contents = JSON.parse(decodeURIComponent(scope.contents));
            scope.initialize();
        }
    }
});

app.controller("accountCon",function($scope,$rootScope,dataManager,$location,$window){
    $scope.countryCodes = countryCodes;
    $scope.parentSearching = false;
    $scope.parentSearch = "";
    $scope.pageIndex = {
        startIndex:1,
        pageId:1,
        pageMax:1,
        goToPage:function(index){
            let href = window.location.href;
            if(href.indexOf('?')>0)
                href=  href.substring(0,href.indexOf('?'));
            href+='?pid='+index;
            window.location.href = href;
        }
    }


    $scope.newAccount = {
        name:"",
        priority:'1',
        description: "",
        official:"",
        country:"1"
    }

    $scope.submitDoc = function(){
        let updateQuery = JSON.parse(JSON.stringify($scope.newAccount));
        if(updateQuery.name.length ===0) {
            alert('公司名称不能为空');
            return;
        } else if(updateQuery.description=== ''){
            alert('请为客户输入简单的描述');
            return;
        }
        updateQuery.priority = Number(updateQuery.priority);
        updateQuery.country = Number(updateQuery.country);
        dataManager.saveData('account','account added',updateQuery);
    }

    $scope.$on('account added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            cancelDoc();
            $scope.contents.entries.unshift(data.result);
        }
    });


    $scope.initialize = function(){
        $scope.pageIndex.pageMax = Math.ceil($scope.contents.maxCount/25);
        let pageId = 1;
        let index = window.location.search.indexOf('pid=');
        if(index >=0){
            let substr = window.location.search.substring(index+4);
            let endIndex = substr.indexOf('&');
            if(endIndex >=0)
                substr = substr.substring(0,endIndex);
            pageId = Number(substr);
        }
        $scope.pageIndex.pageId = pageId;
        $scope.pageIndex.startIndex = $scope.pageIndex.pageId - 7;
        if($scope.pageIndex.startIndex<1)
            $scope.pageIndex.startIndex = 1;
    }

});