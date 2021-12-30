app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.projectId = scope.projectId;
            scope.initialize();
        }
    }
});

app.directive('getHour',function($rootScope){
    return{
        restrict:"EA",
        scope:{
            "user":'@',
            'task':'@'
        },
        link:function(scope,element,attr){
           let comments = $rootScope.comments;
           let hourCount = 0;
           for (let i=0; i<comments.length;++i){
               if(comments[i].user._id === scope.user && comments[i].task._id === scope.task)
                   hourCount+= comments[i].hours;
           }
           element.html(hourCount/8 + 'M/D');
        }
    }
});

app.directive('contributorHour',function($rootScope){
    return{
        restrict:"A",
        scope: {
            hours:"@",
            total:"@",
            width:"@",
        },
        link:function(scope,element,attr){
            scope.hours = Number(scope.hours);
            scope.total  = Number(scope.total);
            if(scope.width)
                scope.width = Number(scope.width);
            else
                scope.width = 30;
            element.css('width',scope.width*(scope.hours/scope.total)+'rem');
            let newDiv  = document.createElement('DIV');
            newDiv.style.width = '2rem';
            newDiv.style.height = '1rem';
            newDiv.style.fontWeight ='bold';
            newDiv.style.marginLeft= '15rem';
            newDiv.style.color = 'black';

            let ratio  = ((scope.hours*100/scope.total).toFixed(2));
            newDiv.innerText = ratio + '%';
            element.append(newDiv);
        }
    }
});


app.directive('contributorTask',function($rootScope){
    return{
        restrict:"A",
        scope: {
            count:"@",
            total:"@",
            wdith:"@",
        },
        link:function(scope,element,attr){
            scope.count = JSON.parse(scope.count);
            if(scope.width)
                scope.width = Number(scope.width);
            else
                scope.width = 30;
            let val = 0;
            for(let i=0; i<scope.count.length;++i)
                val += scope.count[i];
            scope.total  = Number(scope.total);
            let ratio = (val/scope.total).toFixed(2);
            element.css('width',scope.width*ratio+'rem');
            let newDiv  = document.createElement('DIV');
            newDiv.style.width = '12rem';
            newDiv.style.height = '1rem';
            newDiv.style.fontWeight ='bold';
            newDiv.style.marginLeft= '10rem';
            newDiv.style.color = 'black';
            newDiv.innerText = ratio + '% participated';
            element.append(newDiv);
        }
    }
});


app.controller("rootCon",function($scope,$rootScope,$location,$window,$filter,dataManager){
  $scope.dateNow = new Date(Date.now());
  $scope.records = [];
  $scope.effort = {
      "total":0,
  };
  $scope.users = [];
  $scope.taskType = {};
  $scope.taskTypeList = {};
  $scope.comments = [];
  $scope.detailnum = 1;
  $scope.milestonenum = 1;
  $scope.subGroup = 30;
  $scope.projectDuration = 0;
  $scope.maxType = 8;

  $scope.request = function(){
      dataManager.requestData('tasks','root tasks received',{search:{project:$rootScope.projectId,parent:[]},populate:
              [{path:'engineer'},{path:'submitter'},{path:'children',
                  populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                      populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                          populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                              populate:[{path:'engineer'},{path:'submitter'},{path:'children',
                                  populate:[{path:'engineer'},{path:'submitter'}]}]}]}]}]}]});
      dataManager.requestData('tasks','alert tasks received',{search:{project:$rootScope.projectId},populate:'engineer submitter'});
  }

  $scope.requestTaskComments = function(){
      let recordList = [];
      for(let i=0; i<$scope.records.length;++i){
          recordList.push($scope.records[i]._id);
      }
      dataManager.requestData('taskComment','comment received',{search:{task:{$in:recordList}},cond:{sort:{date:1}},populate:'user submitter task'});
  }

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

    $scope.calculateEffort = function(){
      for(let i=0;i<$scope.records.length;++i){
          let rec = $scope.records[i];
          if(!rec.hours)
              rec.hours = 0;
          $scope.effort.total += rec.hours;
      }
    }

    $scope.calculateTask = function(){
      for(let i=0;i<$scope.records.length;++i){
          let rec = $scope.records[i];
          let recType = rec.type.toString();
          if(!$scope.taskType[recType])
              $scope.taskType[recType] = 0;
          if(!$scope.taskTypeList[recType])
              $scope.taskTypeList[recType] = [];
          $scope.taskType[recType]++;
          $scope.taskTypeList[recType].push($scope.records[i]);
      }
    }

    $scope.calculate = function(){
      $scope.calculateEffort();
      $scope.calculateTask();
    }


    $scope.finishDate = function(){
      if($scope.finish)
          return ",and it finished at the date of "+$filter($scope.finish)(`&y/&m/&d`)+'.';
      else
          return ", and is to be continued."
    }

    $scope.sum = function(arr){
      let val = 0;
      for(let i=0;i <arr.length;++i)
          val+= arr[i];
      return val;
    }

    $scope.calculateRootTasks = function(root){
      let rootList = [];
      let temp = JSON.parse(JSON.stringify(root));
      temp = temp.children;
      while(temp.length >0){
          let pop = temp.pop();
          rootList.push(pop);
          if(pop.children)
              temp = temp.concat(pop.children);
      }
      root.taskType = {};
      root.taskList = {};
      root.taskCount = rootList.length;
      root.totalHours = root.hours;
      root.users = {};
      for(let i=0; i<rootList.length;++i){
          let type = rootList[i].type;
          if(!root.taskList[type.toString()]){
              root.taskType[type.toString()] = 0;
              root.taskList[type.toString()] = [];
          }
          root.taskType[type.toString()] ++;
          root.taskList[type.toString()].push(rootList[i]);
          root.totalHours += rootList[i].hours;
          let commentList = $scope.getCommentsByTask(rootList[i]);
          rootList[i].comments = commentList;
          $scope.assignCommentsToUsers(root.users,commentList);
      }
      root.userList = Object.values(root.users);
      root.userList.sort(function(a,b){
          let nameA = a.name;
          let nameB = b.name;
          return nameA >nameB? 1:-1;
      })
      for (let i=0; i<$scope.taskTypeList[1].length;++i){
          let rec=  $scope.taskTypeList[1][i];
          if(rec._id === root._id)
              $scope.taskTypeList[1][i] = root;
      }
    }

    $scope.calculateComments = function(){
      for(let i=0;i<$scope.comments.length;++i){
          let c = $scope.comments[i];
          if($scope.users.indexOf(c.user._id) <0){
              $scope.users.push(c.user._id);
              $scope.effort[c.user._id] = c.user;
              c.user.hours = 0;
              c.user.taskCount = [0,0,0,0,0,0,0,0];
              c.user.taskList = [];
          }
          $scope.effort[c.user._id].hours += c.hours;
          let taskList = $scope.effort[c.user._id].taskList;
          if(taskList.indexOf(c.task._id)<0){
              $scope.effort[c.user._id].taskList.push(c.task._id);
             $scope.effort[c.user._id].taskCount[c.task.type]+=1;
          }
      }
    }

    $scope.sortComments = function(){
        $scope.comments.sort(function(a,b){
            let dateA = new Date(a.date);
            let dateB = new Date(b.date);
            return dateA-dateB;
        })

        let start = $scope.projectStart = new Date($scope.comments[0].date);
        $scope.projectStart.setHours(0);
        $scope.projectStart.setMinutes(0);
        $scope.projectStart.setSeconds(1);
        let projectStart = document.getElementById("projectStart");
        if(projectStart)
            projectStart.innerText = $filter('month')(start.getMonth())+' '+$filter('calenderDate')(start.getDate())+', '+start.getFullYear();
        let projectEnd = document.getElementById("projectEnd");
        if(projectEnd)
            projectEnd.innerText = $scope.finishDate();

        let end = $scope.projectEnd || new Date(Date.now());
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        let days = Math.floor((end - $scope.projectStart)/ (24*60*60*1000));
        $scope.projectDuration = days;
    }

    $scope.getCommentsByTask = function(task){
      let list = [];
      for(let i=0; i<$scope.comments.length;++i){
          if($scope.comments[i].task._id === task._id)
              list.push($scope.comments[i]);
      }
      return list;
    }

    $scope.assignCommentsToUsers = function(users,comments){
       for(let i=0; i<comments.length;++i){
            let comment = comments[i];
            let userId=  comment.user._id;
            if(!users[comment.user._id]){
                users[comment.user._id] = {_id:comment.user._id,name:comment.user.name,title:comment.user.title,type:comment.user.type,status:comment.user.status};
                users[comment.user._id].commentList = [];
                users[comment.user._id].taskType = {};
                users[comment.user._id].taskHours = 0;
                users[comment.user._id].taskCount = 0;
                users[comment.user._id].taskList = {};
                users[comment.user._id].taskTypeList = [[],[],[],[],[],[],[],[]];
            }
           let type = comment.task.type;
           if(!users[userId].taskType[type.toString()])
               users[userId].taskType[type.toString()] = 0;
            users[userId].taskType[type.toString()] += comment.hours;
            users[userId].taskHours += comment.hours;
            let taskList = users[userId].taskTypeList[type];
            if(users[userId].taskTypeList[type].indexOf(comment.task._id) <0)
                users[userId].taskTypeList[type].push(comment.task._id);
            if(!users[comment.user._id].taskList[comment.task._id])
                users[comment.user._id].taskList[comment.task._id] = comment.task;
            users[comment.user._id].commentList.push(comment);
            users[comment.user._id].taskCount = 0;
            for(let i =0; i<users[comment.user._id].taskTypeList.length;++i){
                let list = users[comment.user._id].taskTypeList[i];
                users[comment.user._id].taskCount += list.length;
            }
       }
    }


    $scope.assignCommentsToTasks = function(records){
      if(!records)
          return;
      $scope.taskUserCount = 0;
      $scope.taskUserNum = 1;
      for(let i=0;i<records.length;++i){
          let comment = $scope.comments[i];
          for(let j=0;j<records.length;++j){
              let task = records[j];
              if(task._id === comment.task._id){
                  if(!task.users){
                      task.users = {};
                      task.userList = [];
                  }
                  if(!task.users[comment.user._id]){
                      task.users[comment.user._id] = comment.user;
                      task.userList.push(comment.user._id);
                  }
                  if(task.users[comment.user._id].hourCount === undefined)
                      task.users[comment.user._id].hourCount =0;
                  if(!task.users[comment.user._id].commentList)
                      task.users[comment.user._id].commentList = [];
                  task.users[comment.user._id].hourCount += comment.hours;
                  task.users[comment.user._id].commentList.push(comment);
              }
          }
      }
      for(let i=0; i<records.length;++i){
          if(!records[i].users){
              $scope.taskUserCount += 1;
              continue;
          }
          $scope.taskUserCount += records[i].userList.length;
      }
      $scope.taskUserNum = Math.ceil($scope.taskUserCount/$scope.subGroup);

    }


    $scope.divideTasks = function(){
        let taskList = JSON.parse(JSON.stringify($scope.rootTasks));
        let subChildren = true;
        while(subChildren){
            subChildren = false;
            for(let i=0;i<taskList.length;++i){
                if(taskList[i].children.length >0){
                    if(!taskList[i].prefix)
                        taskList[i].prefix = "";
                    let children = taskList[i].children;
                    for(let j=0;j<children.length;++j){
                        children[j].prefix = taskList[i].prefix+ "__";
                    }
                    taskList = taskList.slice(0,i+1).concat(children).concat(taskList.slice(i+1,taskList.length));
                    subChildren = true;
                    taskList[i].children = [];
                    break;
                }
            }
        }
        $scope.assignCommentsToTasks(taskList);
        $scope.flatTaskList = [];
        $scope.flatContributeTaskList = [[]];
        let index=  0;
        let subGroup = $scope.subGroup;
        while(index < taskList.length){
            $scope.flatTaskList.push(taskList.slice(index,index+=subGroup));
        }
        index =0;
        for(let i=0; i<taskList.length;++i){
            index+= taskList[i].userList ? taskList[i].userList.length : 1;
            taskList[i].index = i;
            let length = $scope.flatContributeTaskList.length-1;
            if(index >= $scope.subGroup){
                $scope.flatContributeTaskList.push([]);
                length = $scope.flatContributeTaskList.length-1;
                $scope.flatContributeTaskList[length].push(taskList[i]);
                index = taskList[i].userList? taskList[i].userList.length :1;
            }else
                $scope.flatContributeTaskList[length].push(taskList[i]);
        }
        $scope.detailnum = Math.ceil(taskList.length/subGroup);
    }



    $scope.$on('alert tasks received',function(event,data){
        if(data.success){
            $scope.records = JSON.parse(JSON.stringify(data.result));
            $scope.records = $scope.records.sort($scope.sortTask);
            $scope.calculate();
            $scope.requestTaskComments();
        }else
            alert(data.message);
    })

    $scope.$on('root tasks received',function(event,data){
        if(data.success){
            $scope.rootTasks = JSON.parse(JSON.stringify(data.result));
            $scope.rootTasks = $scope.rootTasks.sort($scope.sortTask);
            $scope.rootTasks.forEach($scope.stackSort);
        }else
            alert(data.message);
    })

    $scope.$on('comment received',function(event,data){
        if(data.success){
            $rootScope.comments = $scope.comments = data.result;
            $scope.calculateComments();
            $scope.sortComments();
            $scope.divideTasks();
            $scope.rootTasks.forEach($scope.calculateRootTasks);
            $rootScope.records = $scope.records;
            $scope.assignCommentsToTasks($rootScope.records);
        } else
            alert(data.message);
    });


    $scope.initialize = function(){
      $scope.request();
    }
});