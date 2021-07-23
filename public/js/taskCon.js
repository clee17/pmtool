
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

app.directive('taskRecord',function(){
    return{
        restrict:"A",
        scope: {
            schedule:"@",
            status:"@"
        },
        link:function(scope,element, attr){
            let schedule = null;
            if(scope.schedule)
                schedule  = new Date(scope.schedule);
            let dateNow = new Date(Date.now());
            scope.passed = schedule && schedule < dateNow ;
            scope.today = schedule && schedule.getFullYear()==dateNow.getFullYear() && schedule.getMonth() == dateNow.getMonth() && schedule.getDate() == dateNow.getDate();

            scope.checkClosed = function(){
                if(scope.status === '4' || scope.status === '5'){
                    element.css('background','lightgray');
                    element.css('cursor','pointer');
                    return true;
                }else
                    return false;
            };

            scope.regular = function(){
                if(scope.today)
                    element.css('color','rgba(53,42,131,1)');
                else if(scope.passed)
                    element.css('color','rgba(233,51,32,1)');
                else
                    element.css('color','rgba(65,65,65,1)');
            };

            scope.isClosed = function(){
                return scope.status === '4' || scope.status === '5';
            }

            if(!scope.checkClosed())
                 scope.regular();

            element
                .on('mouseover',function(){
                    if(scope.isClosed())
                        element.css('background','rgba(185,185,185,1)');
                    else if(scope.today && !scope.isClosed()) {
                        element.css('color','rgba(99,80,242,1)');
                    }else if(scope.passed && !scope.isClosed())
                        element.css('color','rgba(152,75,67,1)');
                    else
                        element.css('color','rgba(185,185,185,1)')
                    element.css('cursor','pointer');
                })
                .on('mouseleave',function(){
                    scope.checkClosed();
                    scope.regular();
                    element.css('cursor','default');
                })
        }
    }
})


app.controller("taskCon",function($scope,$rootScope,$location,$window,$cookies,dataManager){
    $rootScope.savingTask = false;
    $rootScope.accounts = [];
    $scope.tasks = [];
    $rootScope.search = {status:{$in:[]},type:{$in:[]},pid:1};

    $scope.onClick = function(event){
        let target = event.target;
        $scope.$broadcast('clicked',{target:target});
    };

    $rootScope.submitDoc = function(){
       $rootScope.$broadcast($rootScope.submitType,null);
    };

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


    $rootScope.loadSearch = function(){
        let statusCondition = $cookies.getObject('tasksearchstatuscond');
        let typeCondition = $cookies.getObject('tasksearchtypecond');
        let status = statusCondition || {$in:[0,1,2,3]};
        let type = typeCondition || {$in:[0,1,2,3]};
        $rootScope.search.status = status;
        $rootScope.search.type = type;
    }

    $rootScope.loadTask = function(){
        let search = JSON.parse(JSON.stringify($rootScope.search));
        delete search.pid;
        let request = [
            { $match: search},
            { $sort:{schedule:1}},
            { $skip:35*($rootScope.search.pid -1)},
            { $limit:35},
            {$lookup:{from: "taskComment",
                    let: {taskId: "$_id"},
                    pipeline: [
                        {$match:{ $expr:{$eq:["$$taskId","$task"]}}},
                        {$sort:{date:-1}},
                        {$limit:5},
                        {$lookup:{from:'user',localField:'user',foreignField:"_id",as:"user"}},
                        {$unwind:{path: "$user", preserveNullAndEmptyArrays: true }},
                    ],
                    as: "log"}},
            {$lookup:{from:'project',localField:'project',foreignField:"_id",as:"project"}},
            {$lookup:{from:'version',localField:'version',foreignField:"_id",as:"version"}},
            {$lookup:{from:'account',localField:'account',foreignField:"_id",as:"account"}}]

        dataManager.requestAggregateData('tasks','tasks received', request);
    };

    $rootScope.loadPage = function(){
        if($rootScope.countingPage)
            return;
        $rootScope.countingPage = true;
        dataManager.countPage('tasks',$rootScope.search);
    }


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


    $scope.initialize = function(){
        $scope.loadSearch();
        $scope.loadTask();
        $scope.loadPage();
    }

    $rootScope.refresh = function(){
        $scope.loadTask();
        $scope.loadPage();
    }

    $scope.$on('refresh page after search',function(event,data){
        for(var index in data){
            if($scope.search[index])
                $scope.search[index] = data[index];
            if(index ==='status')
                $cookies.putObject('tasksearchstatuscond',data[index]);
            if(index === 'type')
                $cookies.putObject('tasksearchtypecond',data[index]);
        }
        $rootScope.refresh();
    })

    $scope.initialize();

});




app.controller("entryCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.goToTask = function(id){
        $window.location.href= '/task/info?id='+id;
    }

});


app.controller("searchCon",function($scope,$rootScope,$location,$window,dataManager){
    $scope.status = [
        {name:"VERIFYING",index:0},
        {name:"ENGINEER",index:1},
        {name:"VERIFICATION",index:2},
        {name:"FEEDBACK",index:3},
        {name:"CLOSED",index:4},
        {name:"PENDING",index:5},
    ];
    $scope.types = [
        {name:"ISSUE",index:0},
        {name:"REQUIREMENT",index:1},
        {name:"RELEASE",index:2},
        {name:"QA",index:3},
    ];

    $scope.selectedStatus = [];
    $scope.selectedTypes = [];

    $scope.company = null;
    $scope.project = null;

    $scope.switchFilter = function(event,index){
        event.preventDefault();
        event.stopPropagation();
        let indexes = ['status','types'];
        let elements = document.getElementsByClassName('filterBoard');
        if(elements.length> index){
            $rootScope.$broadcast('floatClicked', {target:elements[index],index:indexes[index],height:$scope[indexes[index]].length*2});
        }
    }


    $scope.selectFilter = function(index,id,event,signal){
        if(!$scope[index])
            return;
        let fIndex = $scope[index].indexOf(id);
        if(fIndex >=0){
            $scope[index].splice(fIndex,1);
        }else{
            $scope[index].push(id);
        }
        $scope.$emit("refresh page after search", {status:{$in:$scope.selectedStatus},type:{$in:$scope.selectedTypes}});
        $scope.$broadcast('filter refreshed', {selected:$scope[index],index:signal});
        $scope.refreshSearches();
    };

    $scope.refreshSearches = function(){
        $scope.refreshStatusButton();
        $scope.refreshTypeButton();
    }

    $scope.refreshStatusButton = function(){
        let statusButton = document.getElementById('statusButton');
        if($scope.selectedStatus.length >0 && statusButton){
            statusButton.style.color = "rgba(152,75,67,1)";
            statusButton.style.border= "solid 2px rgba(152,75,67,1)";
            statusButton.style.fontWeight = "bold";
        }else{
            statusButton.style.border = "solid 1px rgba(185,185,185,1)";
            statusButton.style.color = "inherit";
            statusButton.style.fontWeight = "normal";
        }
    }

    $scope.refreshTypeButton =function(){
        let typeButton = document.getElementById('typeButton');
        if($scope.selectedTypes.length >0 && typeButton){
            typeButton.style.color = "rgba(152,75,67,1)";
            typeButton.style.border= "solid 2px rgba(152,75,67,1)";
            typeButton.style.fontWeight = "bold";
        }else{
            typeButton.style.border = "solid 1px rgba(185,185,185,1)";
            typeButton.style.color = "inherit";
            typeButton.style.fontWeight = "normal";
        }
    }

    $scope.$on('refresh filter',function(evetnt,data){
        $scope.$broadcast('filter refreshed', {selected:$scope.selectedStatus,index:'status'});
        $scope.$broadcast('filter refreshed', {selected:$scope.selectedTypes,index:'types'});
    })

    $scope.initialize = function(){
        $scope.selectedStatus = $rootScope.search.status.$in;
        $scope.selectedTypes = $rootScope.search.type.$in;
        $scope.refreshSearches();
    }

    $scope.initialize();

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
    $scope.pid = $rootScope.search.pid;
    $scope.maxCount = 0;
    $scope.maxPage = 1;

    $scope.goToPage = function(index){
        if($scope.requesting)
            return;
        $scope.pid = index+1;
        let path = $location.path();
        let end = path.indexOf('?');
        if(end>0)
            path = path.substring(0,end);
        $window.history.pushState(path+'?pid='+$scope.pid);
        $scope.$emit('refresh page after search', {pid:$scope.pid});
    }

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $scope.maxCount = data.maxCount;
            $scope.maxPage = Math.ceil(data.maxCount/35);
        }else
            alert(data.message);
    });
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
        let populate = { path: 'project', select: {'name': 1,'_id': 1}};

        dataManager.saveData('tasks','task added', {search:updateTask,populate:populate});
    }
});