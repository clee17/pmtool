app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
        }
    }
});

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

window.addEventListener("popstate", function(e) {
    //浏览器后退按钮监听
}, false);


app.directive('paymentDue',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{},
        link:function(scope,element,attr){
            let entry = scope.$parent.entry;
            let date = entry.date;
            date = Number(new Date(date));
            date += 1000*60*60*24*50;
            if(Date.now() >= date && entry.status<2){
                element.css('color','rgba(152,75,67,0.8)');
            }else{
                element.css('color','inherit');
            }
        }}
});



app.directive('paymentProject',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{},
        link:function(scope,element,attr){
            let entry = scope.$parent.entry;
            let project = entry.project;
            if(project){
                let html = '<a  href="/project/info?id='+entry.project._id+'" target="_blank">'+entry.project.name+'</a>';
                element.html(html)
            }else{
                element.html('General customer');
            }
        }}
});



app.controller('accountCon',function($scope,$rootScope,$window,$location,dataManager) {
    $scope.onClick = function(event){
        let target = event.target;
        $scope.$broadcast('clicked',{target:target});
    };

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        if($scope.leftLoaded && $scope.rightLoaded){
            $scope.initialized = true;
        }
    }

    $rootScope.$on('$locationChangeSuccess', function() {
        let path = $location.path();
        let start = path.indexOf('/accounting/')+12;
        let id = path.substring(start);
        let end = path.indexOf('?');
        if(end>0)
            id = path.substring(0,end);
        if(id === ''){
            id = 'payment';
            $window.history.pushState(null,null,'/accounting/payment');
        }
        $scope.$broadcast('pageChanged',{id:id});
    });


    $scope.$on('pageChange',function(event,data){
        if($rootScope.pageId === data.id)
            return;
        $rootScope.pageId = data.id;
        $window.history.pushState(null,null,'/accounting/'+data.id);
        console.log($rootScope.pageId);
    })

    $scope.$on('leftLoaded',function(){
        $scope.leftLoaded=  true;
        $scope.initialize();
    });

    $scope.$on('rightLoaded',function(){
        $scope.rightLoaded = true;
        $scope.initialize();
    });
});

app.controller('leftController',function($scope,$rootScope,$location,dataManager) {
    $scope.options = [
        {name:"Payment",id:"payment"},
        {name:"Collection",id:"collection"}
    ];


    $scope.$on('pageChanged',function(event,data){
        $scope.pageIndex = data.id;
    });

    $scope.changePage = function(pageId){
        $scope.$emit('pageChange',{id:pageId});
    }

    $scope.$emit('leftLoaded', {});
});

app.controller('mainController',function($scope,$rootScope,$compile,$timeout,dataManager) {
    $scope.pid = 1;
    $scope.maxCount = 0;
    $scope.maxPage = 1;
    $scope.options = [
        {name:"Payment",id:"payment"},
        {name:"Collection",id:"collection"}
    ];
    $scope.status = [
        {name:"PO",index:0},
        {name:"INVOICE",index:1},
        {name:"PAID",index:2},
        {name:"PART",index:3},
    ];
    $scope.search = {};
    $scope.company = null;
    $scope.searchName = "";
    $scope.accountList = [];

    $scope.searchCompany = function($event){
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
        dataManager.requestData('account','company search finished',{search:{name:{$regex:$scope.searchName,$options:"g"}},cond:{limit:10}});
    };

    $scope.clearCompany = function($event){
        $scope.company = null;
        if($scope.search.account !== undefined)
            delete $scope.search.account;
        let element = document.getElementById('currentCompanyName');
        if(element)
            element.value = "";
        $scope.refreshPage();
    };

    $scope.selectCompany = function(account,event){
        $scope.company = account;
        let element = document.getElementById('currentCompanyName');
        if(element){
            element.value = $scope.company.name;
            $scope.search.account = $scope.company._id;
        }
        $rootScope.$broadcast('force close float', {index:'account'});
        $scope.refreshPage();
    }

    $scope.$on('float status changed',function(event,data){
        if(data.index === 'status'){
            let element = document.getElementById('statusButton');
            element.style.backColor = data.status? 'rgba(215,215,215,0.4)':'white';
            element.style.color = data.status? 'rgba(152,75,67,1)':'inherit';
            element.style.borderColor = data.status? 'rgba(152,75,67,1)':'rgba(185,185,185,1)';
        }
    })

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

    $scope.selectStat = function(index,event){
        if($scope.requesting)
            return;
        let origin = [];
        if($scope.search.status)
            origin = $scope.search.status.$in;
        else
            $scope.search.status = {$in:origin};
        if(origin.indexOf(index)<0){
            let ele = event.target;
            ele.innerHTML = ele.innerHTML + '<i class="fas fa-check"></i>'
            ele.style.color = 'rgba(152,75,67,1)';
            origin.push(index);
        }else{
            let ele = event.target;
            ele.innerHTML = ele.innerHTML.substring(0,ele.innerHTML.indexOf( '<i class="fas fa-check"></i>'));
            ele.style.color = 'inherit';
            origin.splice(origin.indexOf(index),1);
        }
        if($scope.search.status && $scope.search.status.$in.length === 0)
            delete $scope.search.status;
        $scope.refreshPage();
    };

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

    $scope.$on('pageChanged',function(event,data){
        $scope.requestingId = data.id +'_'+Date.now();
        $scope.main_pageIndex = data.id;
        $scope.refreshPage();
     });

    $scope.refreshPage = function(){
        $scope.requesting = true;
        let element = document.getElementById('main_records');
        if(element)
            element.style.opacity = '0';
        let tableName = $scope.main_pageIndex;
        if(tableName === 'collection')
            tableName = 'accounting_'+tableName;
        dataManager.requestData(tableName,'results received',{populate:'project account',search:$scope.search,cond:{sort:{date:-1},skip:20*($scope.pid-1),limit:20},requestingId:$scope.requestingId});
        dataManager.countPage(tableName,{search:$scope.search});
    }

    $scope.$on('results received',function(event,result){
        $scope.requesting = false;
        if(result.success){
            $scope.entries = result.result;
            $scope.maxCount = result.count;
            $scope.initPage();
        }else{
            alert(result.message);
            let element = document.getElementById('main_records');
            if(element)
                element.style.opacity = '1';
        }
    })

    $scope.$on('countReceived',function(event,data){
        if(data.success){
            $scope.maxCount = data.maxCount;
            $scope.maxPage = Math.ceil(data.maxCount/20);
        }else
            alert(data.message);
    });

    $scope.switchFilter = function(event){
        event.preventDefault();
        event.stopPropagation();
        let element = document.getElementById('filterBoard');
        if(element){
            $rootScope.$broadcast('floatClicked', {target:element,index:'status',height:8});
        }
    }

    $scope.initPage = function(){
        let html = '<div style="margin:auto;">No information found</div>';
        switch($scope.main_pageIndex){
            case 'payment':
                html = '<table class="entryTable">' +
                    '<tr><td>Account</td><td>Project</td><td>Description</td><td>Amount</td><td>Status</td><td>Created</td><td>Due by</td></tr>'+
                    '<tr ng-repeat="entry in entries" class="entry" payment-due>' +
                    '<td><a href="{{\'/account/info?id=\'+entry.account._id}}" target="_blank">{{entry.account.name}}</a></td>' +
                    '<td payment-project></td>' +
                    '<td>{{entry.comment}}</td>' +
                    '<td>{{entry.amount}}  {{entry.currency | currency:\'full\'}}</td>' +
                    '<td>{{entry.status | payStatus}}</td>' +
                    '<td>{{entry.date | date:\'&d %m, &y\'}}</td>' +
                    '<td>{{entry | dueBy:\'&d %m, &y\'}}</td>' +
                    '</tr></table>'
                break;
            case 'collection':
                break;
            case 'default':
                break;
        }

        if($scope.entries.length ===0){
            html += '<div style="margin:auto;font-size:1.2rem;font-weight:bold;">No entries found</div>';
        }
        let element = document.getElementById('main_records');
        if(element){
            element = angular.element(element);
            element.html('');
            element.append($compile(html)($scope));
            $timeout(function(){
                element.css('opacity','1');
            },200);
        }
    }

    $scope.$emit('rightLoaded', {});
});