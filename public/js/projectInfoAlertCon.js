app.controller('alertCon',function($scope,$rootScope,$location,dataManager) {
    $scope.paymentAlerts = [];
    $scope.taskAlerts = [];
    $scope.alertPageId = 0;
    $scope.maxType = 6;
    $scope.alerts = [];
    $scope.alertPageIndex = function(){
        return $scope.alertPageId;
    }

    $scope.gotoAlertPage = function(index){
        $scope.alertPageId = index;
    }

    $scope.$on('alert payments updated',function(event,data){
        $scope.paymentAlerts = [];
        for(let i=0; i<data.length;++i){
            if(data[i].status !== 2)
                $scope.paymentAlerts.push(data[i]);
        }
        if($scope.paymentAlerts.length>0)
           $scope.alertPageId = 1;
    });

    $scope.$on('bug payments updated',function(event,data){
        $scope.taskAlerts = [];
        for(let i=0; i<data.length;++i){
            if(data[i].status < 2)
                $scope.taskAlerts.push(data[i]);
        }
        if($scope.paymentAlerts.length === 0)
            $scope.alertPageId = 2;
    });

    $scope.noAlert = function(){
        return $scope.paymentAlerts.length + $scope.taskAlerts.length === 0;
    }
});