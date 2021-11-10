app.directive('infoReceiver',function(){
    return{
        restrict:"E",
        link:function(scope){
            scope.initialize();
        }
    }
});

app.filter('projecthrs',function(){
    return function(hrs){
        if(typeof hrs !== 'number')
            hrs = Number(hrs);
        let day = hrs/8;
        return hrs + 'hrs/'+day+'man days';
    }
});



app.directive('progressBar',function($rootScope){
    return{
        restrict:"CA",
        scope: {
            progress:"@",
            max:"@",
            project:"@"
        },
        link:function(scope,element, attr){
            scope.project = JSON.parse(scope.project);
            let progress = Number(scope.progress);
            let max = Number(scope.max);

            let row = Math.floor(progress/max);
            let last = (progress%max)/max;

            let html = "";
            let color = $rootScope.getProjectColor(scope.project._id);
            for(let i=0; i<row;++i){
                html += '<div style="margin-bottom:1px;width:100%;height:0.5rem;background:'+color+';"></div>'
            }

            console.log(progress);
            console.log(max);
            console.log(last);
            html +=  '<div style="width:'+last*100+'%;height:0.5rem;background:'+color+';">&nbsp</div>';
            element.html(html);
        }
    }
})



app.directive('hrsSign',function($rootScope){
    return{
        restrict:"CA",
        scope: {
        },
        link:function(scope,element, attr){
            element.css('background','rgba(255,255,255,0.8)');
            element.css('borderRadius','5px');
        }
    }
})

app.directive('calenderBlock',function($compile,$rootScope){
    return{
        restrict:"A",
        scope: true,
        link:function(scope,element){
            if(!$rootScope.ifWorkDay(scope.$parent.$index))
                element.css('background','lightgray');
            else
                element.css('background','white');
        }
    }
});

app.directive('workBar',function($compile,$rootScope){
    return{
        restrict:"A",
        scope: {
            count:"@",
            eng:"@"
        },
        link:function(scope,element){
            scope.tasks = [];
            scope.tests = 0;

            element.css('background','lightgray');
            scope.$on("rec filed",function(event,data){
                if(!data.now)
                    return;
                let calender = data.calender;
                let today = data.now;
                if(typeof scope.count !== "number")
                    scope.count = Number(scope.count);
                let daymilisec = 1000 * 60 * 60 * 24;
                let current = today - (daymilisec * scope.count);
                let date = new Date(current);
                let year = date.getFullYear();
                let start = new Date(year, 0, 0);
                let diff = date - start;
                let day = Math.floor(diff / daymilisec);


                if(calender[year] && calender[year][day] && calender[year][day][scope.eng])
                    scope.tasks = calender[year][day][scope.eng];

                let contents = "";
                let left = 0;
                for(let i=0;i<scope.tasks.length;++i){
                    let width = scope.tasks[i].hours/8*20;
                    let projectId = scope.tasks[i].task.project;
                    let color = $rootScope.getProjectColor(projectId);
                    contents += '<div style="height:100%;width:'+width+'rem;margin-left:'+left+'rem;background:'+color+';">&nbsp</div>'
                    left += width;
                }
                if(contents.length >0){
                    let html = $compile(contents)(scope);
                    element.append(html);
                }
            })
        }
    }
});


app.directive('engRecord',function($rootScope){
    return{
        restrict:"A",
        scope:true,
        link:function(scope){
            scope.count = scope.$index;
        }
    }
});

app.directive('calcDate',function($rootScope){
    return{
        restrict:"A",
        scope:{
            count:"@",
        },
        link:function(scope,element){
            if (typeof scope.count !== 'number')
                scope.count =  Number(scope.count);
            scope.getWeekDay = function(index){
                let list= ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                return list[index];
            }
            scope.getMonth = function(month){
                let list = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return list[month];
            }
            scope.trimDate = function(date){
                let str = date.toString();
                if(str.length <= 1)
                    str = '0'+ str;
                return str;
            }

            scope.refresh = function(){
                let miliseconds = $rootScope.today - 1000 * 60 * 60 * 24 * scope.count;
                let timeStamp = new Date(miliseconds);
                element.html(
                    '<span style="border-radius:5px;background:rgba(152,75,67,0.8);margin-left:auto;margin-right:auto;padding:3px;font-weight:bold;color:white;">'+scope.getWeekDay(timeStamp.getDay())+'</span>' +
                    '<br><span>'+scope.getMonth(timeStamp.getMonth())+'&nbsp'+scope.trimDate(timeStamp.getDate())+'&nbsp'+timeStamp.getFullYear()+'&nbsp</span>'
                );
            }

            scope.$on('date refreshed',function(event,data){
                scope.refresh(data.today);
            })

            if(scope.count === $rootScope.entrynum-1)
                $rootScope.$broadcast('date refreshed',{});
        }
    }
});


app.controller("effortCon",function($scope,$rootScope,dataManager,$location,$window){
    $scope.entries = [];
    $scope.view = 1;

    $scope.engineers = [];
    $rootScope.projects = {};
    $scope.projectList = [];
    $rootScope.projectsCount = 0;
    $rootScope.addProject = function(projectId,projectInfo){
        let color = ['#9B2226','#AE2012','#BB3E03','#CA6702','#EE9B00','#E9D826','#94D2BD','#0A9396','#005F73','#001219'];
        if(!projectId)
            return;
        if(!$rootScope.projects[projectId])
            $rootScope.projects[projectId] = projectInfo || {};
        let project = $rootScope.projects[projectId];
        project.color = color[$rootScope.projectsCount%color.length];
        project.hrs = 0;
        if(!project.tasks)
            project.tasks = [];
        $rootScope.projectsCount++;
        return $rootScope.projects[projectId].color;
    }

    $rootScope.getProjectColor = function(projectId){
        if($rootScope.projects[projectId])
            return $rootScope.projects[projectId].color;
        else
            return $rootScope.addProject(projectId);
    }
    $rootScope.entrynum = 7;
    $scope.entrynumCount = $rootScope.entrynum.toString();
    $rootScope.today = new Date(Date.now());
    $rootScope.today.setHours(23);
    $rootScope.today.setMinutes(59);
    $rootScope.today.setSeconds(59);
    $scope.todayString= $rootScope.today.getFullYear()+'-'+($rootScope.today.getMonth()+1)+'-'+$rootScope.today.getDate();
    let dateSelector = document.getElementById('date');
    if(dateSelector)
        dateSelector.value = $scope.todayString;
    $rootScope.today = Number($rootScope.today);


    $scope.calender = {};

    $rootScope.ifWorkDay = function(index){
            if(typeof index !== 'number')
                index = Number(index);
            let miliseconds = $rootScope.today - 1000 * 60 * 60 * 24 * index;
            let timeStamp = new Date(miliseconds);
            let weekDay = timeStamp.getDay();

            return weekDay !== 0 && weekDay <6;
    }

    $scope.updateProjectList = function(){
        $scope.projectList = [];
        let id = Object.keys($rootScope.projects);
        for(let i=0; i<id.length;++i){
            $scope.projectList.push($rootScope.projects[id[i]]);
        }
    };

    $scope.updateTaskList = function(tasks,project){
        let tempTask = {};

        for(let i=0;i<tasks.length;++i){
            if(tempTask[tasks[i]._id]){
                tempTask[tasks[i]._id].hours += tasks[i].hours;
            }else{
                tempTask[tasks[i]._id] = tasks[i];
            }

            if(!tempTask[tasks[i]._id].sub)
                tempTask[tasks[i]._id].sub = [];
            let sub = tempTask[tasks[i]._id].sub;

            let recorded = false;
            for(let i=0; i<sub.length;++i){
                if(sub[i]._id === tasks[i]._id)
                    recorded = true;
            }
            if(!recorded)
               tempTask[tasks[i]._id].sub.push({_id:tasks[i]._id,user:tasks[i].user,hours:tasks[i].hours});
        }

        let keys = Object.keys(tempTask);
        project.tasks = [];
        for(let i=0;i<keys.length;++i){
            project.tasks.push(tempTask[keys[i]]);
        }

        console.log(project.tasks);

    }

    $scope.$on('engineers received',function(event,data){
        if(data.success)
            $scope.engineers = data.result;
        else{
            $scope.engineers = [];
            alert(data.message);
        }

        let engList = [];
        for(let i=0; i< $scope.engineers.length;++i){
            engList.push($scope.engineers[i]._id);
        }

        let oldest = $scope.today - 1000 * 60 * 60 * 24 * $rootScope.entrynum;
        let newest = $scope.today;

        for(let i=0; i<$scope.engineers.length;++i)
                $scope.engineers[i].tasks = [].constructor($rootScope.entrynum);

        dataManager.request("/hrsByEng","tasks received", {minTime:oldest,maxTime:newest,eng:engList});
    });

    $scope.$on('tasks received',function(event,data){
        if(data.success){
            $scope.records = data.result;
            $scope.processRec();
            $scope.showBoard();
        }else{
            alert(data.message);
            $scope.err = data.message;
        }
    });

    $scope.showBoard = function(){
        $scope.err = null;
        if($scope.currentBoard)
            $scope.currentBoard.style.opacity = "1";
        $scope.currentBoard = null;
    }

    $scope.processRec = function(){
        let records = $scope.records;
        $rootScope.projects = {};
        for(let i=0;i<records.length;++i) {
            if (!$scope.calender[records[i].year])
                $scope.calender[records[i].year] = {};
            if (!$scope.calender[records[i].year][records[i].day])
                $scope.calender[records[i].year][records[i].day] = {};
            if (!$scope.calender[records[i].year][records[i].day][records[i].user])
                $scope.calender[records[i].year][records[i].day][records[i].user] = [];
            $scope.calender[records[i].year][records[i].day][records[i].user].push(records[i]);

            if (!$rootScope.projects[records[i].project._id]) {
                $rootScope.addProject(records[i].project._id, records[i].project);
            }
            let project = $rootScope.projects[records[i].project._id];
            if(!project.tasks)
                project.tasks = [];
            project.tasks.push(records[i].task);
            $scope.updateTaskList(project.tasks,project);
            project.hrs += records[i].task.hours;
        }
            $scope.updateProjectList();
            $scope.$broadcast("rec filed",{calender:$scope.calender,now:$rootScope.today});
    }

    $scope.refreshEngineer = function(){
        dataManager.requestData('user','engineers received',{search:{type:1,status:0}});
    }

    $scope.refreshDate = function(){
        $rootScope.$broadcast('date refreshed',{today:$rootScope.today});
    }

    $scope.refreshData = function(){
        let date = document.getElementById("date");
        let today =  new Date(date.value);
        today.setHours(23);
        today.setMinutes(59);
        today.setSeconds(59);
        $rootScope.today = Number(today);
        $rootScope.entrynum = Number($scope.entrynumCount);
        $scope.refreshEngineer();
        $scope.refreshDate();
    }

    $scope.initialize = function(){
        $scope.refreshEngineer();
        $scope.refreshDate();
    }

});