app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
            $rootScope.userId = scope.userId;
            scope.contents = JSON.parse(decodeURIComponent(scope.contents));
            scope.initialize();
        }
    }
});

app.directive('filterCheck',function(){
    return{
        restrict:"C",
        scope:{
            index:"@",
            id:"@",
        },
        link:function(scope,element,attr){
            scope.isChecked = function(){
                let rootScope = scope.$parent.$parent;
                if(typeof scope.id !== 'number')
                    scope.id = Number(scope.id);
                if(rootScope[scope.index].indexOf(scope.id) >=0){
                    let children = element.children();
                   children[1].style.display = 'inline-block';
                   element.css('color','rgba(152,75,67,1)');
                }else{
                    element.css('color','inherit');
                    let children = element.children();
                    children[1].style.display = 'none';
                }

            };

            scope.isChecked();

            scope.$on('filter refreshed',function(event,data){
                scope.isChecked();
            });
        }
    }
})

app.directive('floatBoard',function(){
    return{
        restrict:"C",
        scope:{
            index:"@"
        },
        link:function(scope,element,attr){
            scope.clicked = false;
            scope.$on('floatClicked',function(event,data){
                if(data.index === scope.index) {
                    scope.clicked = !scope.clicked;
                    if(data.status)
                        scope.clicked=  data.status;
                    let height = scope.clicked ? data.height + 'rem' : '0';
                    let opacity = scope.clicked ? '1' : '0';
                    element.css('height', height);
                    element.css('opacity', opacity);
                    scope.refresh();
                }

            });

            // click to close the panel;
            scope.$on('clicked',function(event,data){
                if(scope.clicked){
                    let target =data.target;
                    let hide = true;
                    while(target){
                        if(target === element[0])
                            hide = false;
                        target= target.parentElement;
                    }
                    if(hide){
                        element.css('height',0);
                        element.css('opacity',0);
                        scope.clicked = false;
                    }
                    scope.refresh();
                }

            });

            // Finish on the click issue
            scope.$on('force close float',function(event,data){
                if(data.index === scope.index) {
                    scope.clicked = false;
                    element.css('height', '0');
                    element.css('opacity', '0');
                    scope.refresh();
                }
            })

            // finish on
            scope.refresh = function(){
                scope.$emit('float status changed',{index:scope.index, status:scope.clicked});
            }

        }}
})

app.directive('projectStatus',function(){
    return{
        restrict:"A",
        scope: {
            schedule:"@",
            status:"@"
        },
        link:function(scope,element, attr){
            let schedule  = new Date(scope.schedule);
            let dateNow = new Date(Date.now());
            scope.passed = schedule < dateNow;
            scope.today = schedule.getFullYear()==dateNow.getFullYear() && schedule.getMonth() == dateNow.getMonth() && schedule.getDate() == dateNow.getDate();
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

app.controller("projectDashboard",function($scope,$rootScope,dataManager,$location,$window,$filter,$cookies){
    $scope.pageIndex = {
        startIndex:1,
        pageId:1,
        pageMax:1,
        goToPage:function(index){
            $scope.pageIndex.pageId = index;
            $scope.searchProject();
            $scope.countProject();
        }
    }

    $scope.company = null;

    $scope.status = [
        {index:0,name:"opportunities"},
        {index:1,name:"business"},
        {index:2,name:"development"},
        {index:3,name:"delivery"},
        {index:4,name:"maintenance"},
        {index:5,name:"closed"},
        {index:6,name:"re-open"},
        {index:7,name:"mass production"},
    ];

    $scope.searchName = "";

    $scope.accountList = [];

    $scope.printHTML = function(){
        $scope.printing = true;
        let Id = [];
        for(let i=0; i<$scope.contents.entries.length;++i){
            let entry = $scope.contents.entries[i];
        }
        dataManager.requestData('projectComment',)
    };

    $scope.$on('print comments received',function(event,data){
        let doc = new jsPDF('p','pt',[480,860]);
        if(!data.success){
            alert(data.message);
            return;
        }
        let table = document.getElementById('projectTable');
        var options = {
            pagesplit:true,
            background:'#FFFFFF'
        };
        if(!table)
            return;
        let entries = $scope.contents.entries;

        let y= 15;
        let x = 15;
        doc.setTextColor(0,75,151);
        doc.setFontSize(8);
        for(let i=0; i<entries.length;++i){
            let entry = entries[i];
            let dash  = '        ';
            let newText = (i+1)+'. '+ (entry.account? entry.account.name : '                 ');
            newText += dash +entry.name;
            newText += dash+entry.priority;
            newText += dash+'status:'+$filter('status')(entry.status);
            newText += dash+'established:'+$filter('date')(entry.date,"&y/&m/&d");
            doc.textWithLink(newText,x,y,{pageNumber:i+2});
            y+= 10;
        }


        for(let i=0; i<entries.length;++i){
            doc.addPage();
            let entry = entries[i];
            y=25;
            doc.setTextColor(76,76,76);
            doc.setFontSize(12);
            let newText = entry.name+'_'+(entry.delivery?entry.delivery.name:'product to be updated')+'          by '+(entry.account?entry.account.name :'');
            doc.text(newText,x,y)
            let dim = doc.getTextDimensions(newText);
            dim.y +=12;
            y+=12;
            let url = 'http://192.168.0.239:4000/project/info?id='+entry._id;
            doc.setFontSize(8);
            doc.setTextColor(0,75,151);
            doc.textWithLink(url,x,y,{ url: url });
        }

        let twoDigit = function(str){
            if(typeof str !== 'string')
                str = str.toString();
            if(str.length <2)
                return '0'+str;
            else
                return str;

        }
        let date = new Date(Date.now());
        let name = 'projects_report_';
        name += date.getFullYear() + '/'+twoDigit(date.getMonth())+'/'+twoDigit(date.getDate());
        name += '_'+twoDigit(date.getHours())+':' +twoDigit(date.getMinutes())+':' + twoDigit(date.getSeconds());
        name += '.pdf';
        doc.save(name);
    });

    $scope.selectFilter = function(index,id,event){
        if(!$scope[index])
            return;
        let fIndex = $scope[index].indexOf(id);
        if(fIndex >=0 ){
            $scope[index].splice(fIndex,1);
        }else{
            $scope[index].push(id);
        }
        $scope.searchProject();
        $scope.countProject();
        $scope.$broadcast('filter refreshed',null);
    };

    $scope.onClick = function(event){
        let target = event.target;
        $scope.$broadcast('clicked',{target:target});
    };

    $scope.searchCompany = function(){
        $scope.accountList = [];
        $scope.companyRequesting = true;
        let height = $scope.accountList.length*1.5;
        let showBoard = $scope.searchName.length >0;
        let element = document.getElementById('companySearchBoard');
        if(element){
            if(height <= 5)
                height = 5;
            $rootScope.$broadcast('floatClicked', {target:element,index:'account',status:showBoard,height:height,status:showBoard});
        }
        let request = {search:{name:{$regex:$scope.searchName,$options:"g"}},cond:{limit:10}};
        dataManager.requestData('account','company search finished',request);
    }


    $scope.selectCompany = function(account,event){
        $scope.company = account;
        let element = document.getElementById('currentCompanyName');
        if(element){
            element.value = $scope.company.name;
            $scope.search.account = $scope.company._id;
        }
        $rootScope.$broadcast('force close float', {index:'account'});
        $scope.searchProject();
        $scope.countProject();
    };

    $scope.clearCompany = function($event){
        $scope.company = null;
        if($scope.search.account !== undefined)
            delete $scope.search.account;
        let element = document.getElementById('currentCompanyName');
        if(element)
            element.value = "";
        $scope.searchProject();
        $scope.countProject();
    };

    $scope.logout = function(){
        dataManager.requestLogout({_id:$rootScope.userId});
    }

    $scope.$on('logoutComplete',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $window.location.reload();
        }
    });

    $scope.statusVisible =false;

    $scope.showStatus = function(){
        $scope.statusVisible = !$scope.statusVisible;
        let element = document.getElementById('projectStatusPanel');
        if(!element)
            return;
        if($scope.statusVisible){
            element.style.width = '8rem'
            element.style.height = '12rem';
            element.style.opacity = '1';
        }else {
            element.style.width = '0';
            element.style.height = '0';
            element.style.opacity = '0';
        }
    };
    $scope.goToProject = function(id){
        $window.location.href= '/project/info?id='+id;
    }

    $scope.searchProject = function(){
        if($scope.requesting)
            return;
        $scope.requesting = true;
        $cookies.putObject('projectsearchcond',$scope.search);
        dataManager.requestData('project','projects received',
            {search:$scope.search,cond:{sort:{schedule:1},
                    skip:($scope.pageIndex.pageId-1)*25,limit:25},
                populate:'account delivery owner'});
    };

    $scope.countProject = function(){
        if($scope.counting)
            return;
        $scope.counting = true;
        dataManager.countPage('project',$scope.search);
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
        if(np.account === '0')
            updateQuery.account = null;
        if(np.endCustomer === '0')
            updateQuery.endCustomer = null;
        updateQuery.status = Number(updateQuery.status);
        updateQuery.owner = $rootScope.userId;
        updateQuery.populate = 'account owner';
        dataManager.saveData('project','project added',updateQuery);
    }

    $scope.switchFilter = function(event){
        event.preventDefault();
        event.stopPropagation();
        let element = document.getElementById('filterBoard');
        if(element){
            $rootScope.$broadcast('floatClicked', {target:element,index:'status',height:16});
        }
    };

    $scope.$on('project added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            let commentUpdate= {};
            commentUpdate.project = data.result._id;
            commentUpdate.date = Date.now();
            commentUpdate.schedule = data.result.schedule;
            commentUpdate.comment = data.result.description;
            commentUpdate.user = $rootScope.userId;
            dataManager.saveData('projectComment','project comment finished',commentUpdate);
            $scope.newProject.name = '';
            $scope.newProject.account = '1';
            $scope.newProject.endCustomer = '1';
            $scope.newProject.description = '';
            $scope.contents.entries.unshift(data.result);
            $scope.cancelAddDoc();
        }
    });

    $scope.$on("project comment finished",function(event,data){
        if(!data.success){
            alert(data.message);
        }
    });

    $scope.$on('projects received',function(event,data){
        $scope.requesting = false;
        if(data.success){
            $scope.contents.entries = data.result;
        }else{
            alert(data.message);
        }
    });

    $scope.$on('countReceived',function(event,data){
        $scope.counting = false;
        if(data.success){
           $scope.maxCount = data.maxCount;
            $scope.pageIndex.pageMax = Math.ceil($scope.maxCount/25);
            $scope.pageIndex.startIndex = $scope.pageIndex.pageId - 7;
            if($scope.pageIndex.startIndex<1)
                $scope.pageIndex.startIndex = 1;
        }else{
            alert(data.message);
        }
    });

    $scope.$on('company search finished',function(event,data){
        $scope.companyRequesting = false;
        if(!data.success){
            alert(data.message);
        }else{
            $scope.accountList = data.result;
            let element = document.getElementById('companySearchBoard');
            if(element)
                element.style.height = (data.result.length*1+0.5)+'rem';
        }
    });

    $scope.initialize = function(){
        $scope.maxCount = $scope.contents.maxCount;
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
        let searchCond = $cookies.getObject('projectsearchcond');
        $scope.search = searchCond || {};
        $scope.selectedStatus = [
            0,1,2,3,4,6
        ];
        if(searchCond)
            $scope.selectedStatus =  JSON.parse(JSON.stringify(searchCond.status.$in));
        $scope.search.status = {$in:$scope.selectedStatus};
        $scope.search.owner = $scope.userId;
        $scope.searchProject();
        $scope.countProject();
    }
});