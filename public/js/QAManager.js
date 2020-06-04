app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.contents = JSON.parse(decodeURIComponent(scope.contents));
            scope.initialize();
        }
    }
});

app.filter('QAType',function(){
    return function(type){
        if(typeof type !== 'number')
            type = Number(type);
        let typeList = ['QUICK','RELEASE'];
        return typeList[type] || 'Unknown';
    }
});

app.controller("QADashboard",function($scope,$rootScope,dataManager){
    $scope.QAList = [];
    $scope.types = [
        {code:"0",name:"quick"},
        {code:"1",name:"release"},
    ];
    $scope.versions = [
        {_id:"1",version: {type:1,info:'please choose a version'}}
    ];
    $scope.projects = [
        {_id:"0",name:"Please select a project"}
    ];

    $scope.newTest = {
        type:"1",
        priority:"1",
        project:"0",
        version:"1"
    };

    $scope.$watch('newTest.project',function(newVal,oldVal){
        let val = newVal === '0'? 15 : 17;
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0){
            $scope.saving = true;
            elements[0].style.height = val+'rem';
            if($scope.newTest.project !== "0")
                dataManager.requestData('version','versions received',{project:$scope.newTest.project});
        }
    });

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

    $scope.$on('versions received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.versions = [
                {_id:"1",version: {type:1,info:'please choose a version'}},
                {_id:"0",version:{type:2, info:"no version"}}
            ];
            $scope.versions = $scope.versions.concat(data.result);
        }
    });

    $scope.$on('projects received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            for(let i=0;i<data.result.length;++i){
                if(data.result[i].account)
                    data.result[i].name = data.result[i].account.name + "_"+data.result[i].name;
                else
                    data.result[i].name ="CIDANA_"+data.result[i].name;
            }
           data.result.sort(function(a,b){
               if(!a.account){
                   if(b.account)
                       return -1;
                   else{
                       return a.name[0]<b.name[0]? -1 :1;
                   }
               }
               if(!b.account)
                   return 1;
               return a.account.name[0].toLowerCase() < b.account.name[0].toLowerCase() ? -1:1;
           });
            $scope.projects =  $scope.projects.concat(data.result);
        }
    })

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
        dataManager.requestData('QA','QA Received',{});
        dataManager.requestData('project','projects received',{search:{status:{$lte:4}},populate:'account delivery'});
    }
});