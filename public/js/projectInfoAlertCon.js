app.filter('projecthrs',function(){
    return function(hrs){
        if(typeof hrs !== 'number')
            hrs = Number(hrs);
        let day = hrs/8;
        return hrs + 'hrs/'+day+'man days';
    }
});

app.directive('hrsSign',function(){
    return{
        restrict:"CA",
        scope: {
            hrs:"@",
            rec:"@",
        },
        link:function(scope,element, attr){
            scope.type = false;
            if(scope.rec && typeof scope.rec !== undefined){
                scope.rec = JSON.parse(scope.rec);
            }

            if(scope.rec && scope.rec.hours > scope.rec.plan.hours){
                element.css('color','red');
                element.css('fontWeight','bold');
            }else if(scope.rec){
                element.css('color','inherited');
                element.css('fontWeight','normal');
            }

            scope.displayHour = function(){
                if(scope.type)
                    element.html((scope.hrs/8).toFixed(1)+'days');
                else
                    element.html((scope.hrs)+'hrs');
            }

            scope.$on('set time type',function(event,data){
                if(data.type !== undefined)
                    scope.type = data.type;
                scope.displayHour();
            })
        }
    }
})


app.directive('taskStatus',function(){
    return{
        restrict:"CA",
        scope: {
            status:"@",
        },
        link:function(scope,element, attr){
            scope.type = false;
            if(scope.status && typeof scope.rec !== 'number'){
                scope.status = Number(scope.status)
            }

            if(scope.status === 4){
                element.css('color','dimgray');
                element.css("background","lightgray");
            }
        }
    }
})

app.controller('alertCon',function($scope,$rootScope,$location,$filter,dataManager) {
    $scope.taskType = 1;
    $scope.records = [];
    $scope.maxType = 8;
    $scope.taskTypeList = [''];

    $scope.dayOrHour = false;

    $scope.$watch('dayOrHour',function(newVal,oldVal){
        $scope.$broadcast('set time type',{type:$scope.dayOrHour})
    })

    $rootScope.addingTask = false;

    $scope.changeType=function(index){
        if($scope.refreshing)
            return;
        $scope.taskType = index;
        $scope.refresh();
    }

    $scope.$on('records received',function(event,data){
    });

    $scope.editTask = function(rec){
        $rootScope.submitType = "editTask";
        $rootScope.submitSelection = 1;
        showPageCover(30,35);
        $rootScope.$broadcast('newEditTask',{task:rec});
    }

    $scope.refresh = function(){
        $scope.refreshing = true;
        dataManager.requestData('tasks','alert tasks received',{search:{project:$rootScope.project._id},populate:
                [{path:'engineer'},{path:'submitter'},{path:'children',
                    populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                        populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                            populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                                populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                                populate:[{path:'engineer'},{path:'submitter'}]}]}]}]}]}]});
    }

    $scope.$on('log received',function(event,data){
        if(data.success){
            $scope.logs = data.result;
        } else
            alert(data.message);
    });

    $scope.sortTask = function(a,b){
            let at = new Date(a.plan.start);
            let bt = new Date(b.plan.start);
            return at-bt;
    }

    $scope.stackSort = function(rec){
        if(rec.children)
            rec.children.sort($scope.sortTask);
        rec.children.forEach($scope.stackSort);
    }

    $scope.$on('alert tasks received',function(event,data){
        $scope.refreshing = false;
        if(data.success){
            $scope.records = JSON.parse(JSON.stringify(data.result));
            $scope.records = $scope.records.sort($scope.sortTask);
            $scope.records.forEach($scope.stackSort);
            let recordList = [];
            for(let i=0; i<$scope.records.length;++i){
                recordList.push($scope.records[i]._id);
            }
            dataManager.requestData('taskComment','log received',{search:{task:{$in:recordList},date:{$gte:Date.now()-7*24*60*60*1000,$lte:Date.now()}},cond:{sort:{date:1}},populate:'user submitter'});
        }else
            alert(data.message);
    })

    $scope.$on('taskCancelDoc',function(event,data){
        $rootScope.submitType = null;
        cancelDoc();
    })

    $scope.checkChildrenTask = function(children,record){
        for(let i=0;i<children.length;++i){
            let id= children[i]._id;
            if(record.parent.indexOf(id) >=0){
                children[i].children.push(record);
            }
            if(children[i].children)
                $scope.checkChildrenTask(children[i].children,record);
        }
    }

    $scope.$on("new task saved",function(event,data){
        $scope.taskSaving = false;
        if(data.success){
            if(data.result.parent.length ===0)
               $scope.records.push(data.result);
            else{
                $scope.records.push(data.result);
                $scope.checkChildrenTask($scope.records,data.result);
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

    $scope.displayHour = function(hours){

    }

    $scope.newChildTask = function(rec){
        $rootScope.submitType='task';
        showPageCover(30,35);
        $rootScope.$broadcast('addNewTask',{parent:rec._id,type:-1});
    }

    $scope.duplicate = function(rec){
        if($scope.taskType !== 1)
            return false;
        if(rec.parent.length === 0)
            return false;
        else{
            let parent = rec.parent;
            let task = rec;
            while(parent.length >0){
                for(let i=0;i<$scope.records.length;++i){
                    if(parent.indexOf($scope.records[i]._id)>=0){
                        parent = $scope.records[i].parent;
                        task = $scope.records[i];
                    }
                }
            }
            return task.type === $scope.taskType;
        }
    }

    $scope.ExportExcel = function(){
        let taskList = [];
        for(let i=0;i<$scope.records.length;++i){
            if($scope.records[i].parent.length ===0 && $scope.records[i].type === $scope.taskType && !$scope.duplicate($scope.records[i]))
                taskList.push(JSON.parse(JSON.stringify($scope.records[i])));
        }

        let subChildren = true;
        while(subChildren){
            subChildren = false;
            for(let i=0;i<taskList.length;++i){
                if(taskList[i].children.length >0){
                    if(!taskList[i].prefix)
                        taskList[i].prefix = "";
                    let children = taskList[i].children;
                    for(let j=0;j<children.length;++j){
                        children[j].title = taskList[i].prefix + ">"+children[j].title;
                        children[j].prefix = taskList[i].prefix+ ">";
                    }
                    taskList =taskList.slice(0,i+1).concat(children).concat(taskList.slice(i+1,taskList.length));
                    subChildren = true;
                    taskList[i].children = [];
                    break;
                }
            }
        }
        let dateNow = new Date(Date.now());
        var sheetName = dateNow.getFullYear()+'-'+(dateNow.getMonth()+1)+'-'+dateNow.getDate();
        var fileName = $rootScope.project.name + '_'+ dateNow.getFullYear()+'-'+(dateNow.getMonth()+1)+'-'+dateNow.getDate();
        let table = "<table><tr><td>Task Info</td><td>Type</td><td>Owner</td><td>PM</td><td>Log Last Week</td><td>Estimated Start</td><td>Estimated End</td><td>Effort</td><td>Estimated Effort</td><td>Today</td></tr>";

        for(let i=0;i<taskList.length;++i){
            let t = taskList[i];
            table += t.status === 4? '<tr style="background:gray;">': '<tr>';
            let title = t.title;
            if(t.parent.length ===0)
                title = '<b style="font-size:2rem;">'+t.title + '</b>';
            else if(t.prefix ==='>')
                title = '<b style="font-size:1rem;font-style:italic;">'+t.title + '</b>';
            table += '<td>'+title+'</td>';
            table += '<td>'+$filter('taskType')(t.type)+'</td>';
            let engineer = t.engineer? t.engineer.name : "";
            table += '<td>'+engineer+'</td>';
            let name = t.submitter? t.submitter.name:'';
            table += '<td>'+name+'</td>';
            //effort
            table += '<td>';
            for(let i=0;i<$scope.logs.length;++i){
                if($scope.logs[i].task === t._id){
                    stringifyData($scope.logs[i]);
                    let log = $scope.logs[i];
                    let date = new Date(log.date);
                    table += date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'    ';
                    table += log.user.name + '    ';
                    if(log.hours)
                        table += '<b>'+log.hours+'hrs</b>    ';
                    table += log.comment + '\n';
                }
            }
            table += '</td>';
            //start
            let stamp = t.plan.start? new Date(t.plan.start) : null;
            let dateStamp = stamp? stamp.getFullYear()+'-'+(stamp.getMonth()+1)+'-'+stamp.getDate() : "";
            table += '<td>'+dateStamp+'</td>';
            stamp = t.plan.end? new Date(t.plan.end) : null;
            dateStamp = stamp? stamp.getFullYear()+'-' + (stamp.getMonth()+1) + '-' + stamp.getDate(): "";
            table += '<td>' + dateStamp + '</td>';
            table += '<td>'+t.hours/8+'</td>';
            table += '<td>'+(t.plan.hours/8).toFixed(2)+'</td>';
            table += '<td></td>';
            table += '</tr>';
        }
        table += '</table>';

        tableToExcel(table, sheetName, fileName, "dlink");
    }

    $scope.refresh();
});


app.controller("newTaskCon",function($scope,$rootScope,$compile,$timeout,$window,dataManager) {

    $scope.versions = [];

    $scope.$on('versions received',function(event,data){
        if(!data){
            alert('failed to retrieve historic versions.');
        }else if(!data.success){
            alert(data.message);
        }else {
            $scope.versions = data.result;
        }
    });

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
            let value = "";
            if(date)
               value = date.getFullYear()+'-'+ trimDigit(date.getMonth()+1,2)+'-'+trimDigit(date.getDate(),2);
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
                    "                        <option value=\"1\">Requirement</option>" +
                    "                        <option value=\"2\">release</option>" +
                    "                        <option value=\"3\">QA</option>" +
                    "                        <option value=\"0\">Issue</option>" +
                    "                        <option value=\"4\">Documentation</option>" +
                    "                        <option value=\"6\">task</option>" +
                    "                        <option value=\"7\">payment</option>" +
                    "                        <option value=\"5\">Other</option>" +
                    "                    </select></div>")($scope);
            element.append(node);
        }









    });



    $scope.$on("task",function(event,data){
        if(typeof $scope.newTask.type !== 'number')
            $scope.newTask.type = Number($scope.newTask.type);
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



app.controller("editTaskCon",function($scope,$rootScope,$compile,$filter,$timeout,$window,dataManager) {

    $scope.versions = [];
    $scope.switch_desc = false;
    $scope.switch_type = false;
    $scope.switch_estimate = false;

    $scope.$on('versions received',function(event,data){
        if(!data){
            alert('failed to retrieve historic versions.');
        }else if(!data.success){
            alert(data.message);
        }else {
            $scope.versions = data.result;
        }
    });


    $scope.newTask = {
        title:"",
        type:1,
        project:$rootScope.project._id,
        account:$rootScope.project.account._id,
        version:null,
        dueOn: null,
        engineers:[],
        parent:[],
        children:[],
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

    $rootScope.getDateMessage = function(date){
        if(typeof date !== 'object')
            date = new Date(date);
        return  date.getFullYear()+'-'+ trimDigit(date.getMonth()+1,2)+'-'+trimDigit(date.getDate(),2);
    }

    $scope.updateTime = function(eleId,date){
        let startEle = document.getElementById(eleId);
        if(startEle){
            let value = "";
            if(date)
                value = $rootScope.getDateMessage(date);
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

    $scope.updateTask = function(task){
        $scope.newTask.title = task.title;
        $scope.newTask.type = task.type.toString();
        $scope.newTask.project = task.project;
        $scope.newTask.account = task.account;
        $scope.newTask.version = task.version;
        $scope.newTask.dueOn = task.dueOn;
        $scope.newTask.enginers = task.engineers;
        $scope.newTask.parent = task.parent;
        $scope.newTask.children = task.children;
        $scope.newTask.description = task.description;
        $scope.newTask.plan = task.plan;

        $scope.newTask.plan.start = new Date($scope.newTask.plan.start);
        $scope.newTask.plan.end = new Date($scope.newTask.plan.end);
        $scope.newTask.dueOn = new Date($scope.newTask.dueOn);

        $scope.newTask._id = task._id;
    }

    $scope.updateSaveTask = function(task){
        $scope.tempSave = JSON.parse(JSON.stringify(task));
        $scope.tempSave.plan.start =  new Date(task.plan.start);
        $scope.tempSave.plan.end = new Date(task.plan.end);
        $scope.tempSave.dueOn = new Date(task.dueOn);
        $scope.tempSave.type = task.type.toString();
    }

    $scope.$on('newEditTask',function(event,data){
        if(!data.task)
            return;
        $scope.newTask = {
            title:"",
            type:1,
            project:$rootScope.project._id,
            account:$rootScope.project.account._id,
            version:null,
            dueOn: null,
            engineers:[],
            parent:[],
            children:[],
            description:"",
            plan:{
                start: new Date(Date.now()),
                end: new Date(Date.now()+7*24*60*60*1000),
                hours: 0,
            }
        }
        let task = data.task;
        $scope.updateTask(task);
        $scope.updateSaveTask(task);
        $scope.monitor = true;
        $scope.updateTime("editStarter",$scope.newTask.plan.start);
        $scope.updateTime("editEnd",$scope.newTask.plan.end);
        $scope.updateTime('editDueOn',$scope.newTask.dueOn);
    });

    $scope.$on('editTaskCancelDoc',function(event,data){
        $scope.monitor = false;
        $rootScope.submitType = null;
        $scope.tempSave = null;
        $rootScope.submitSelection = 0;
        cancelDoc();
    })

    $scope.getContents = function(sign){
        let contents = '';
        let list = sign.split('.');
        contents = $scope.newTask[list.shift()];
        while(list.length >0){
            contents = contents[list.shift()];
        }
        return contents;
    }

    $scope.editContents = function(key,ele,sign){
        if($scope.updating && ele.innerHTML === 'EDIT')
            return;
        $scope[key] = !$scope[key];
        let contents = '';
        if(sign.indexOf('|')>=0){
            contents = {};
            let list = sign.split('|');
            for(let i=0; i<list.length;++i){
                contents[list[i]] = $scope.newTask[list[i]];
            }
        }else if(sign.indexOf('.')>=0){
            contents = $scope.getContents(sign);
        }else
            contents = $scope.newTask[sign];

        $scope.savingCallBack = function(){
            ele.innerHTML = "EDIT";
            $scope.saving = false;
            $scope.updating = false;
            if(sign === 'description')
                ele.parentElement.parentElement.style.background = 'lightgray';
        };
        $scope.failCallBack = function(){
            ele.innerHTML = "SAVE";
            $scope.saving = false;
            $scope[key] = !$scope[key];
        }
        if($scope[key]){
            ele.innerHTML = "SAVE";
            $scope.updating = true;
            if(sign === 'description'){
                let box = ele.parentElement.previousElementSibling;
                box.value = contents;
                ele.parentElement.parentElement.style.background = 'white';
            }
        }else{
            $scope.saving = true;
            $scope.skip = false;

            let updateQuery = {search:{_id:$scope.newTask._id},updateExpr:{}};
            let commentQuery = {search: {task:$scope.newTask._id,user:$rootScope.user._id, date:Date.now()},updateExpr:{type:3,comment:""}};
            let box = ele.parentElement.previousElementSibling;
            if(sign === 'description'){
                if(box.previousElementSibling.value.length <= 10){
                    alert("the description cannot be shorter than 10 digits");
                    $scope[key] = !$scope[key];
                    return;
                }else if($scope.tempSave.description === $scope.newTask.description)
                    $scope.skip = true;
                updateQuery.updateExpr[sign] = contents;
                commentQuery.updateExpr.comment = contents;
                commentQuery.updateExpr.type = 3;
            }else if(sign === 'type'){
                if($scope.tempSave.type === $scope.newTask.type){
                    $scope.skip = true;
                }else{
                    updateQuery.updateExpr[sign] = Number(contents);
                    commentQuery.updateExpr.comment = "the type of task is changed from <b style=\"color:rgba(152,75,67,1)\">" + $filter('taskType')($scope.tempSave.type)+ "</b>  to  <b style=\"color:rgba(152,75,67,1)\">"+$filter('taskType')(contents)+'</b>';
                    commentQuery.updateExpr.type = 6;
                }
            }else if(sign === 'plan.start|plan.end|plan.hours'){
                let update = {start:false,end:false,hours:false};
                if($rootScope.getDateMessage($scope.newTask.plan.start) !== $rootScope.getDateMessage($scope.tempSave.plan.start))
                    update.start = true;
                if($rootScope.getDateMessage($scope.newTask.plan.end) !== $rootScope.getDateMessage($scope.tempSave.plan.end))
                    update.end = true;
                if($scope.newTask.plan.hours !== $scope.tempSave.plan.hours)
                    update.hours = true;
                if(!update.hours && !update.start && !update.end) {
                    $scope.skip = true;
                }else{
                    if(update.start)
                        updateQuery.updateExpr["plan.start"] = new Date($scope.newTask.plan.start);
                    if(update.end)
                        updateQuery.updateExpr["plan.end"] = new Date($scope.newTask.plan.end);
                    if(update.hours)
                        updateQuery.updateExpr["plan.hours"] = Number($scope.newTask.plan.hours);

                    let original = $rootScope.getDateMessage($scope.tempSave.plan.start) +'/' + $rootScope.getDateMessage($scope.tempSave.plan.end) + '('+$scope.tempSave.plan.hours+')';
                    let newDate = $rootScope.getDateMessage($scope.newTask.plan.start) +'/' + $rootScope.getDateMessage($scope.newTask.plan.end) + '('+$scope.newTask.plan.hours+')';

                    commentQuery.updateExpr.comment = "the estimation of task is changed from <b style=\"color:rgba(152,75,67,1)\">" +original+ "</b>to <b style=\"color:rgba(152,75,67,1)\">"+newDate+'</b>.';
                    commentQuery.updateExpr.type = 7;
                }
            }

            if($scope.skip){
                $scope.savingCallBack();
                return;
            }
            updateQuery.info = sign;
            dataManager.updateData('tasks', 'contents edited', updateQuery)
            dataManager.saveData('taskComment', "task comment saved",commentQuery);
        }
    }

    $scope.$on('contents edited', function(event,data){
        if(data.success) {
            $scope.$emit('rec updated',{_id:data.result._id,info:data.info, rec:data.result});
            $scope.updateSaveTask(data.result);
            $scope.savingCallBack();
        } else{
            $scope.failCallBack();
            alert(data.message);
        }
    })

    $scope.$on('task comment saved', function(event,data){
        if(data.success) {
        } else{
            alert(data.message);
        }
    })

    $scope.recoverContents = function(sign){
        if(sign.indexOf('.')>=0) {
            let list = sign.split('.');
            let info = $scope.newTask;
            let target = $scope.tempSave;
            while (list.length > 1) {
                let item = list.shift();
                info = info[item];
                target = target[item];
            }
            info[list[0]] = target[list[0]];
        }else
            $scope.newTask[sign] = $scope.tempSave[sign];
    }

    $scope.cancelContents = function(key,ele,sign){
        $scope[key] = !$scope[key];
        if(sign.indexOf('|')>=0){
            let list = sign.split('|');
            for(let i=0; i<list.length;++i){
               $scope.recoverContents(list[i]);
            }
        }else
            $scope.recoverContents(sign);

        let keyEle = ele.nextElementSibling;
        if(!keyEle)
            keyEle = ele.previousElementSibling;
        if($scope[key]){
            keyEle.innerHTML = "SAVE";
        }else{
            keyEle.innerHTML = "EDIT"
            if(sign === 'description')
                keyEle.parentElement.parentElement.style.background = 'lightgray';
        }
        $scope.updating = false;
    }


    $scope.$on("editTask",function(event,data){
        if(typeof $scope.newTask.type !== 'number')
            $scope.newTask.type = Number($scope.newTask.type);
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