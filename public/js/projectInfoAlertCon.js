app.filter('projecthrs',function(){
    return function(hrs){
        if(typeof hrs !== 'number')
            hrs = Number(hrs);
        let day = hrs/8;
        return hrs + 'hrs/'+day+'man days';
    }
});

app.directive('hrsCompare',function(){
    return{
        restrict:"A",
        scope:{
          rec:"@"
        },
        link:function(scope,element){
            scope.rec = JSON.parse(scope.rec);
            if(scope.rec.hours > scope.rec.plan.hours){
                element.css('color','red');
                element.css('fontWeight','bold');
            }else{
                element.css('color','inherited');
                element.css('fontWeight','normal');
            }
        }
    }
});

app.controller('alertCon',function($scope,$rootScope,$location,dataManager) {
    $scope.taskType = 1;
    $scope.records = [];
    $scope.maxType = 6;
    $scope.taskTypeList = [''];

    $rootScope.addingTask = false;

    $scope.changeType=function(index){
        if($scope.refreshing)
            return;
        $scope.taskType = index;
        $scope.refresh();
    }

    $scope.$on('records received',function(event,data){
    });


    $scope.noAlert = function(){
        return $scope.paymentAlerts.length + $scope.taskAlerts.length === 0;
    }

    $scope.refresh = function(){
        $scope.refreshing = true;
        dataManager.requestData('tasks','alert tasks received',{search:{project:$rootScope.project._id,status:{$lt:4}},cond:{sort:{"plan.start":1}},populate:'children'})
    }

    $scope.$on('alert tasks received',function(event,data){
        $scope.refreshing = false;
        if(data.success){
            $scope.records = data.result;
        }else
            alert(data.message);
    })

    $scope.$on('taskCancelDoc',function(event,data){
        $rootScope.submitType = null;
        cancelDoc();
    })

    $scope.$on("new task saved",function(event,data){
        $scope.taskSaving = false;
        if(data.success){
            if(data.result.parent.length ===0)
               $scope.records.push(data.result);
            else{
                for(let i=0; i<$scope.records.length;++i){
                    let id = $scope.records[i]._id;
                    if(data.result.parent.indexOf(id) >=0)
                        $scope.records[i].children.push(data.result);
                }
            }
        }else{
            alert(data.message);
        }
    })

    $scope.newTask = function(){
        $rootScope.submitType = 'task';
        showPageCover(30,35);
        $rootScope.$broadcast('addNewTask',{type:$scope.taskType});
    }


    $scope.newChildTask = function(rec){
        $rootScope.submitType='task';
        showPageCover(30,35);
        $rootScope.$broadcast('addNewTask',{parent:rec._id,type:-1});
    }

    $scope.duplicate = function(rec){
        if(rec.parent.length === 0)
            return;
        else{
            for(let i=0;i<$scope.records.length;++i){
                if($scope.records[i].type !== $scope.taskType)
                    continue;
                let children = $scope.records[i].children;
                for(let child=0;child<children.length;++child){
                    let childId = children[child]._id || children[child];
                    if(rec._id === childId)
                        return true;
                }
            }
        }
    }

    $scope.refresh();
});


app.controller("newTaskCon",function($scope,$rootScope,$compile,$timeout,$window,dataManager) {
    $scope.newTask = {
        title:"",
        type:1,
        project:$rootScope.project._id,
        account:$rootScope.project.account._id,
        version:null,
        dueOn: null,
        engineers:[],
        description:"",
        plan:{
            start: new Date(Date.now()),
            end: new Date(Date.now()+7*24*60*60*1000),
            hours: 0,
        }
    }

    $scope.calcHour = function(){
        let plan = $scope.newTask.plan;
         plan.end.setHours(23);
        plan.end.setMinutes(59);
        plan.end.setSeconds(59);
        plan.start.setHours(0);
        plan.start.setMinutes(0);
        plan.start.setSeconds(0);
         let days = Math.ceil((plan.end - plan.start)/(1000*60*60*24));
         let dayCount = 0;
        for(let i=0;i<days;i++){
            let today = new Date(Number(plan.start) + 1000*60*60*24 *i);
            let weekday = today.getDay();
            if(weekday !== 0 && weekday <6)
                dayCount++;
        }
        plan.hours = dayCount*8;
        if($scope.newTask.engineers.length >9)
            plan.hours *= $scope.newTask.engineers.length;
    };

    $scope.updateTime = function(eleId,date){
        let startEle = document.getElementById(eleId);
        if(startEle){
            let value = date.getFullYear()+'-'+ trimDigit(date.getMonth()+1,2)+'-'+trimDigit(date.getDate(),2);
            startEle.value =  value;
        }
    }

    $scope.$watch("newTask.plan.start",function(newVal,oldVal){
        if(newVal >= $scope.newTask.plan.end){
            alert("the estimated starter cannot be later than the end");
            let starter = document.getElementById("starterDateLine");
            if(starter){
                starter = angular.element(starter);
                starter.html('');
            }
            $scope.newTask.plan.start = oldVal;
            let newEle = $compile("<span>Estimated Start:</span><input type=\"date\" id=\"estimatedStarter\" ng-model=\"newTask.plan.start\">")($scope);
            starter.append(newEle);
        }else{
            $scope.updateTime("estimatedStarter",newVal);
        }
    },true)

    $scope.$watch("newTask.plan.end",function(newVal,oldVal){
        if(newVal <= $scope.newTask.plan.start){
            alert("the estimated starter cannot be later than the end");
            let end = document.getElementById("endDateLine");
            if(end){
                end = angular.element(end);
                end.html('');
            }
            $scope.newTask.plan.end = oldVal;
            let newEle = $compile("<span>Estimated Start:</span><input type=\"date\" id=\"estimatedEnd\" ng-model=\"newTask.plan.end\">")($scope);
            end.append(newEle);
        }else{
            $scope.updateTime("estimatedEnd",newVal);
        }
    })

    $scope.ready = false;

    $scope.$on('addNewTask',function(event,data){
        if(data.type >=0){
            $scope.newTask.type = data.type;
        }else{
            $scope.newTask.type = -1;
        }
        if(data.parent)
            $scope.newTask.parent = data.parent;
        $scope.ready = true;
        $scope.updateTime("estimatedStarter",$scope.newTask.plan.start);
        $scope.updateTime("estimatedEnd",$scope.newTask.plan.end);
        let element = document.getElementById("newTaskType");
        if(element){
            element = angular.element(element);
            element.html('');
            let node = $compile("<div>no info</div>")($scope);
            if($scope.newTask.type>=0)
               node = $compile("<div style=\"line-height:2rem;height:100%;\">Type:</div><div task-type type=\"{{newTask.type}}\" style=\"padding-top:2px;margin-left:0.5rem;\"></div>")($scope);
            else
                node = $compile("<div style='line-height:2rem;height:100%;'>Type:</div><div style='height:2rem;margin-left:0.5rem;'><select ng-disabled=\"savingTask\" ng-model=\"newTask.type\" onchange=\"this.size=0\" onmousedown=\"if(this.options.length>10){this.size=10}\" onblur=\"this.size = 0\" style=\"position:absolute;z-index:99;top:0.5rem;\">\n" +
                    "                        <option value=\"0\">Issue</option>" +
                    "                        <option value=\"1\">Requirement</option>" +
                    "                        <option value=\"2\">release</option>" +
                    "                        <option value=\"3\">QA</option>" +
                    "                        <option value=\"4\">Documentation</option>" +
                    "                        <option value=\"5\">Other</option>" +
                    "                    </select></div>")($scope);
            element.append(node);
        }
    });

    $scope.$on('versions received',function(event,data){
        if(!data){
            alert('failed to retrieve historic versions.');
        }else if(!data.success){
            alert(data.message);
        }else {
            $scope.versions = data.result;
        }
    });

    $scope.$on("task",function(event,data){
        if(typeof $scope.newTask.type !== 'number')
            $scope.newTask.type = Number($scope.newTask.type);
        console.log($scope.newTask.type);
        if($scope.newTask.title.length <=5){
            alert("task title cannot be empty");
            return;
        }else if($scope.newTask.description.length <=10){
            alert("task description cannot be empty");
            return;
        }else if($scope.newTask.type <0){
            alert("task type must be selected");
            return;
        }

        if($scope.newTask.version === '0')
            $scope.newTask.version = null;
        dataManager.saveTask("new task saved",$scope.newTask);
        $scope.taskSaving = true;
    })

    $scope.finishAddTask = function(){
        $rootScope.submitType = null;
        $scope.newTask  = {
            title:"",
            type:-1,
            project:$rootScope.project._id,
            account:$rootScope.project.account._id,
            engineers:[],
            version:null,
            dueOn: null,
            description:"",
            plan:{
                start: new Date(Date.now()),
                end: new Date(Date.now()+7*24*60*60*1000),
                hours: 0,
            }};
        cancelDoc();
    }

    $scope.$on("new task saved",function(event,data){
        $scope.taskSaving = false;
        if(data.success){
            $scope.finishAddTask();
        }else{
            alert(data.message);
        }
    })
});