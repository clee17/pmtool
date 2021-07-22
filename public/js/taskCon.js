
app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.userId = scope.userId;
        }
    }
});

app.filter('versionname',function(){
    return function(version) {
        if(version.name && version.name.length >0)
            return version.name
        else
            return version.version.main.toString()+'.'+version.version.update.toString()+'.'+version.version.fix.toString();
    }
})

app.filter('objectify',function(){
    return function(obj) {
        if(!obj)
            return "";
        else if(obj.name && obj.name.length >0)
            return obj.name;
        else if(obj.version)
            return obj.version.main + '.'+obj.version.update+'.'+obj.version.fix;
        else
            return "";
    }
})

app.filter('productinfo',function(){
    return function(product) {
        if(!product)
            return "No productInfo";
        else
            return product.name;
    }
})

app.directive('logAnalysis',function($filter){
    return{
        restrict:"A",
        scope: {
            logs:"@"
        },
        link:function(scope,element, attr){
            let logs = JSON.parse(scope.logs);
            if(logs.length === 0)
                element.html( "No log yet");
            else {
                let info = "";
                for (let i = 0; i < logs.length; ++i) {
                    let log = logs[i];
                    let date = $filter('date')(log.date,'&y-&m-&d');
                    let contents = log.comment;
                    if(log.type ==2 && log.status ===4){
                        contents = '<b style="color:rgba(152,75,67,1)">'+ log.user.name + "</b> reopened the task";
                    }else if(log.type ===2){
                        contents = '<b style="color:rgba(152,75,67,1)">'+ log.user.name + "</b> closed the task";
                    }
                    info += ' <div style="max-width:25rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" >'+date;
                    info +="&nbsp&nbsp&nbsp";
                    info += contents;
                    info += '</div>';
                }
                element.html(info);
            }
        }
    }
});



app.directive('infoList',function(){
    return{
        restrict:"A",
        scope: {
            info:"@"
        },
        link:function(scope,element, attr){
            let info = JSON.parse(scope.info);
            let html = "";
            if(!Array.isArray(info)){
                html += ' <div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" >'+info+ '</div>';
                element.html(html);
            }else if(info.length === 0){
                element.html("no info");
            }else{
                for (let i = 0; i < info.length; ++i) {
                    let info_d = info[i];
                    html += ' <div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" >'+info_d.name + '</div>';
                }
                element.html(html);
            }
        }
    }
});

app.directive('taskStatus',function(){
    return{
        restrict:"A",
        scope: {
            schedule:"@",
            status:"@"
        },
        link:function(scope,element, attr){
            let schedule = null;
            if(schedule)
                schedule  = new Date(scope.schedule);
            let dateNow = new Date(Date.now());
            scope.passed = schedule && schedule < dateNow ;
            scope.today = schedule && schedule.getFullYear()==dateNow.getFullYear() && schedule.getMonth() == dateNow.getMonth() && schedule.getDate() == dateNow.getDate();
            if(scope.passed)
                element.css('color','rgba(233,51,32,1)');
            else if(scope.today)
                element.css('color','rgba(53,42,131,1)');
            if(scope.status === '5')
                element.css('color','rgba(185,185,185,1)');
            element
                .on('mouseover',function(){
                    if(scope.status === '5'){
                        element.css('color','rgba(145,145,145,1)');
                        element.css('cursor','pointer');
                        return;
                    }
                    if(scope.passed)
                        element.css('color','rgba(152,75,67,1)');
                    else if(scope.today){
                        element.css('color','rgba(99,80,242,1)');
                    }
                    else
                        element.css('color','rgba(185,185,185,1)')
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    if(scope.status === '5'){
                        element.css('color','rgba(185,185,185,1)');
                        element.css('cursor','auto');
                        return;
                    }
                    if(scope.passed)
                        element.css('color','rgba(233,51,32,1)');
                    else if(scope.today)
                        element.css('color','rgba(53,42,131,1)');
                    else
                        element.css('color','rgba(65,65,65,1)');
                    element.css('cursor','default');
                })
        }
    }
})


app.controller("taskCon",function($scope,$rootScope,$location,$window,dataManager){
    $rootScope.savingTask = false;
    $rootScope.pid = 1;
    $rootScope.accounts = [];
    $scope.tasks = [];
    $rootScope.search = {};

    $scope.onClick = function(event){
        let target = event.target;
        $scope.$broadcast('clicked',{target:target});
    };

    $rootScope.submitDoc = function(){
       $rootScope.$broadcast($rootScope.submitType,null);
    };

    $rootScope.uploadDoc = function(doc){

    };

    $rootScope.saveDoc = function(doc){

    }

    $rootScope.cancelDoc = function(){
        $rootScope.$broadcast($rootScope.submitType+'CancelDoc');
    }

    let renameAttach = function(blob,filename){
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            const body = document.querySelector('body');

            link.href = window.URL.createObjectURL(blob);
            link.download = filename;

            // fix Firefox
            link.style.display = 'none';
            body.appendChild(link);

            link.click();
            body.removeChild(link);

            window.URL.revokeObjectURL(link.href);
        }
    };

    $rootScope.openAttach = function(link,name){
        if($rootScope.openAttaching)
            return;
        $rootScope.openAttaching = true;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/assets/'+link, true);
        xhr.responseType = 'blob';
        xhr.onload = () => {
            $rootScope.openAttaching = false;
            if (xhr.status === 200) {
                renameAttach(xhr.response,name);
            }
        };

        xhr.send();
    }

    $scope.cancelAddDoc = function(){
        let elements = document.getElementsByClassName('addTask');
        if(elements.length>0)
            elements[0].style.height = '0';
        setTimeout(function(){
            let topLayer = document.getElementById('pageCover');
            topLayer.style.display = 'none';
        },200);
    }



    dataManager.requestData('account','account received',{search:{},cond:{sort:{name:1}}});


    $scope.loadTask = function(){
        let request = [
            { $match: {}},
            { $sort:{schedule:1}},
            { $skip:35*($rootScope.pid -1)},
            { $limit:35},
            {$lookup:{from: "taskComment",
                    let: {taskId: "$_id"},
                    pipeline: [
                        {$match:{ $expr:{$eq:["$$taskId","$task"]}}},
                        {$sort:{date:-1}},
                        {$limit:5},
                    ],
                    as: "log"}},
            {$lookup:{from:'user',localField:'user',foreignField:"_id",as:"user"}},
            {$unwind:{path: "$user", preserveNullAndEmptyArrays: true }},
            {$lookup:{from:'project',localField:'project',foreignField:"_id",as:"project"}},
            {$lookup:{from:'version',localField:'version',foreignField:"_id",as:"version"}},
            {$lookup:{from:'account',localField:'account',foreignField:"_id",as:"account"}}]

        dataManager.requestAggregateData('tasks','tasks received', request);
    };

    $scope.$on('account received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.accounts = data.result;
        }
    })

    $scope.$on('task added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            cancelDoc();
            for(let i=0;i<$scope.tasks[i];++i){
                if($scope.tasks[i]._id === data.result._id){
                    $scope.tasks[i] = data.result;
                    return;
                }
            }
            $scope.tasks.push(data.result);
        }
    })

    $scope.$on('tasks received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.tasks = data.result;
        }
    })

    $scope.loadTask();

});




app.controller("entryCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.goToTask = function(id){
        $window.location.href= '/task/info?id='+id;
    }

});


app.controller("searchCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.status = [
        {name:"REVIEW",index:0},
        {name:"WORKING",index:1},
        {name:"VERIFICATION",index:2},
        {name:"CLOSED",index:3},
    ];

    $scope.company = null;
    $scope.project = null;

    $scope.switchFilter = function(event){
        event.preventDefault();
        event.stopPropagation();

        let element = document.getElementById('filterBoard');
        if(element){
            $rootScope.$broadcast('floatClicked', {target:element,index:'status',height:8});
        }
    }
});

app.controller("funcCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.addTask = function(){
        let topLayer = document.getElementById('pageCover');
        if(topLayer)
            topLayer.style.display = 'flex';
        setTimeout(function() {
            let elements = document.getElementsByClassName('addTask');
            if (elements.length > 0)
                elements[0].style.height = '23rem';
        },10);
    };
});

app.controller("pageCon",function($scope,$rootScope,dataManager){
    $rootScope.pid = 1;
    $scope.maxCount = 0;
    $scope.maxPage = 1;

    $scope.refreshPageCount = function(){
        $scope.requesting = true;
        dataManager.countPage('tasks',$rootScope.search);
    }

    $scope.goToPage = function(index){
        if($scope.requesting)
            return;
        $scope.pid = index+1;
        let path = $location.path();
        let end = path.indexOf('?');
        if(end>0)
            path = path.substring(0,end);
        $window.history.pushState(path+'?pid='+$scope.pid);
        $scope.refreshPage();
    }

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $scope.maxCount = data.maxCount;
            $scope.maxPage = Math.ceil(data.maxCount/35);
        }else
            alert(data.message);
    });

    $scope.refreshPageCount();
});

app.controller("newTaskCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.newTask = {
        title:"",
        type:'0',
        account:'0',
        project:'0',
        version:'0',
        dueOn:null,
        description:""
    };

    $scope.projects = [];


    $scope.loadProjects = function(){
        if($scope.newTask.account === '0')
            return;
        dataManager.requestData('project','projects received',
            {populate:'',
                search:{account:$scope.newTask.account},
                cond:{sort:{name:1}},
                requestId:$scope.newTask.account
            });
    };

    $scope.loadVersions = function(){
        if($scope.newTask.project === '0')
            return;
        dataManager.requestData('version','versions received',
            {populate:'',
                search:{project:$scope.newTask.project},
                cond:{sort:{name:1,date:-1}},
                requestId:$scope.newTask.project
            });
    }

    $scope.$on('projects received',function(event,data){
        $scope.newTask.project = '0';
        if(!data.success){
            alert(data.message);
        }else{
            if($scope.newTask.account === data.requestId){
                $scope.projects = data.result;
            }

        }
    })


    $scope.$on('versions received',function(event,data){
        $scope.newTask.version = '0';
        if(!data.success){
            alert(data.message);
        }else{
            if($scope.newTask.project === data.requestId){
                $scope.versions = data.result;
            }
        }
    })

    $scope.submitDoc = function(){
       if($scope.newTask.title === ""){
           alert("title cannot be missing");
           return;
       }else if($scope.newTask.description === ""){
           alert("add some description");
           return;

       }

       $rootScope.savingTask = true;
       let updateTask = JSON.parse(JSON.stringify($scope.newTask));

        updateTask.type = Number(updateTask.type);
        if(updateTask.account === '0')
            updateTask.account = null;
        if(updateTask.project === '0' )
            updateTask.project = null;
        if(updateTask.version === '0')
            updateTask.version = null;

        updateTask.submitter = $rootScope.userId;
        updateTask.schedule = new Date(Date.now()+3*24*60*1000);
        updateTask.populate = { path: 'project', select: {'name': 1,'_id': 1}};

        dataManager.saveData('tasks','task added',updateTask);
    }
});