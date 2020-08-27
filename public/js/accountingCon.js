app.directive('infoReceiver',function($rootScope){
    return{
        restrict:"E",
        link:function(scope){
        }
    }
});

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


app.controller('accountCon',function($scope,$rootScope,$window,$location,dataManager) {
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

app.controller('mainController',function($scope,$rootScope,$compile,dataManager) {
    $scope.pid = 1;
    $scope.maxCount = 0;
    $scope.filter = false;
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

    $scope.$on('pageChanged',function(event,data){
        $scope.requestingId = data.id +'_'+Date.now();
        $scope.main_pageIndex = data.id;
        $scope.refreshPage();
     });

    $scope.refreshPage = function(){
        $scope.requesting = true;
        let tableName = $scope.main_pageIndex;
        if(tableName === 'collection')
            tableName = 'accounting_'+tableName;
        dataManager.requestData(tableName,'results received',{populate:'project account',search:$scope.search,cond:{sort:{date:-1},skip:20*($scope.pid-1),limit:20},requestingId:$scope.requestingId});
    }

    $scope.$on('results received',function(event,result){
        $scope.requesting = false;
        if(result.success){
            $scope.entries = result.result;
            $scope.maxCount = result.count;
            $scope.initPage();
        }else{
            alert(result.message);
        }
    })

    $scope.switchFilter = function(){
        let element = document.getElementById('filterBoard');
        if(element){
            $scope.filter = !$scope.filter;
            element.style.height = $scope.filter? '8rem' : '0';
        }
    }

    $scope.initPage = function(){
        let html = '<div style="margin:auto;">No information found</div>';
        switch($scope.main_pageIndex){
            case 'payment':
                html = '<table class="entryTable">' +
                    '<tr><td>account</td><td>description</td><td>amount</td><td>Status</td><td>created</td><td>due by</td></tr>'+
                    '<tr ng-repeat="entry in entries" class="entry" payment-due>' +
                    '<td>{{entry.account.name}}</td>' +
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
        let element = document.getElementById('main_records');
        if(element){
            element = angular.element(element);
            element.html('');
            element.append($compile(html)($scope));
        }
    }

    $scope.$emit('rightLoaded', {});
});