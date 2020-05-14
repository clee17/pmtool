app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.contents = JSON.parse(decodeURIComponent(scope.contents));
            scope.initialize();
        }
    }
});

app.directive('projectStatus',function(){
    return{
        restrict:"A",
        scope: {
            schedule:"@",
            status:"@"
        },
        link:function(scope,element, attr){
            let schedule  = new Date(scope.schedule);
            let dateNow = Date.now();
            scope.passed = schedule < dateNow;
            if(scope.passed)
                element.css('color','rgba(233,51,32,1)');
            if(scope.status === '5')
                element.css('color','lightgray');
            element
                .on('mouseover',function(){
                    if(scope.status === '5'){
                        element.css('color','rgba(185,185,185,1)');
                        element.css('cursor','pointer');
                        return;
                    }

                    if(scope.passed)
                       element.css('color','rgba(152,75,67,1)');
                    else
                        element.css('color','rgba(185,185,185,1)')
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    if(scope.status === '5'){
                        element.css('color','lightgray');
                        element.css('cursor','auto');
                        return;
                    }
                    if(scope.passed)
                        element.css('color','rgba(233,51,32,1)');
                    else
                        element.css('color','rgba(65,65,65,1)');
                    element.css('cursor','default');
                })
        }
    }
})

app.controller("projectDashboard",function($scope,$rootScope,dataManager,$location,$window){
    $scope.pageIndex = {
        startIndex:1,
        pageId:1,
        pageMax:1,
        goToPage:function(index){
            $location.search('pid',index.toString());
            $window.location.href = $location.absUrl();
        }
    }

    $scope.goToProject = function(id){
        $window.location.href= '/project/info?id='+id;
    }

    $scope.newProject = {
        name:"",
        account:'1',
        endCustomer:'1',
        priority:'1',
        status:'0',
        description:""
    }

    $scope.addProject = function(){
        let topLayer = document.getElementById('pageCover');
        if(topLayer)
            topLayer.style.display = 'flex';
        setTimeout(function() {
            let elements = document.getElementsByClassName('addDoc');
            if (elements.length > 0)
                elements[0].style.height = '17rem';
        },10);
    }

    $scope.cancelAddDoc = function(){
        let elements = document.getElementsByClassName('addDoc');
        if(elements.length>0)
            elements[0].style.height = '0';
        setTimeout(function(){
            let topLayer = document.getElementById('pageCover');
            topLayer.style.display = 'none';
        },200);
    }

    $scope.submitDoc = function(){
        let np = $scope.newProject;
        let updateQuery = JSON.parse(JSON.stringify(np));
        if(np.name.length ===0){
            alert('项目名称不能为空');
            return;
        }else if(np.account.value === '1'){
            alert('请选择一个客户');
            return;
        }else if(np.endCustomer.value === '1'){
            alert('请选择一个终端客户');
            return;
        }
        if(np.account.value === '0')
            updateQuery.account = null;
        else if(np.endCustomer.value === '0')
            updateQuery.endCustomemr = null;
        updateQuery.status = Number(updateQuery.status);
        dataManager.saveData('project','project added',updateQuery);
    }

    $scope.$on('project added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.newProject.name = '';
            $scope.newProject.account = '1';
            $scope.newProject.endCustomer = '1';
            $scope.newProject.description = '';
            $scope.contents.entries.push(data.result);
            cancelAddDoc();
        }
    })

    $scope.initialize = function(){
        $scope.pageIndex.pageMax = Math.ceil($scope.contents.maxCount/25);
        $scope.pageIndex.pageId = $location.search().pid||1;
        $scope.pageIndex.startIndex = $scope.pageIndex.pageId - 7;
        if($scope.pageIndex.startIndex<1)
            $scope.pageIndex.startIndex = 1;
    }
});