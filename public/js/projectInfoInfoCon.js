app.filter('contactIndex',function(){
    return function(index){
        if(index === 0)
            return "Primary Contact";
        else if(index === 1)
            return "secondary contact";
        else if(index === 2)
            return "other contact";
        else
            return ""
    }
});

app.controller("infoCon",function($scope,$rootScope,$location,$compile,$window,dataManager){
    $rootScope.currentRelease = null;
    $rootScope.accountLink = $rootScope.project.account? '/account/info?id='+$rootScope.project.account._id : null;
    $scope.referenceDocs = [];

    $rootScope.sources =[
        {value:"0",name:"assets"},
        {value:"1",name:"online"},
        {value:"2",name:"fileserver"},
    ];

    $scope.projectDetail = {
        active:"0"
    };

    $scope.resetStatus = function(){
        let listIndex = ['5','6','-1'];
        if($rootScope.project.status === 5)
            $scope.activeOptions = [{value:"5",name:"closed"},{value:"6",name:"re-open"}];
        else if($rootScope.project.status === 6)
            $scope.activeOptions = [{value:"6",name:"re-open"},{value:"5",name:"close"}];
        else
            $scope.activeOptions = [{value:"-1",name:"active"},{value:"5",name:"close"}];
        $scope.statusReset = true;
        $scope.projectDetail.active = $rootScope.project.status.toString();
        if(listIndex.indexOf($scope.projectDetail.active) <0){
            $scope.projectDetail.active = "-1";
        }
    }

    $scope.resetReference = function(){
        $scope.newReference = {
            name:"",
            project: false,
            account: $rootScope.project.account? $rootScope.project.account._id : null,
            type:5,
            source:"0",
            description:"",
            link:""
        };
    };

    $scope.ifRecorded = function(_id){
        let projectContacts = $rootScope.project.projectContacts;
       for(let i=0; i<projectContacts.length;++i){
           if(projectContacts[i]._id === _id)
               return false;
       }
       return true;
    };

    $scope.mailTo = function(contact){
        let node =  document.createElement('a');
        node.href="mailto:"+contact.mail+"?body="+"please type your contents here";
        node.style.opacity = 0;
        document.body.appendChild(node);
        node.click();
    };

    $scope.detail = function(contact){

    };

    $scope.addReferenceDoc = function(){
        $rootScope.submitType = 'referenceDoc';
        let innerHTML = '<table>' +
            '<tr><td>name:</td><td><input style="width:12rem" ng-model="newReference.name"></td></tr>'+
            '<tr><td>source:</td><td><select style="width:6rem;" ng-model="newReference.source" ng-options="source.value as source.name for source in sources"></select></td></tr>'+
            '<tr><td>link:</td><td><input style="width:12rem" ng-model="newReference.link"></td></tr>'+
            '<tr><td  colspan="2">' +
            '<div style="display:flex;flex-direction:row;"><div style="line-height:1.5rem;">IfGeneralFile:</div>' +
            '<div style="height:100%;line-height:1.5rem;margin-left:1.5rem;"><input type="checkbox" ng-model="newReference.project" style="width:1rem;height:1.5rem;"></div>' +
            '</div></td></tr>'+
            '<tr><td>description:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newReference.description"></textarea></td></tr>'+
            '<table/>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        let count = $rootScope.project.projectContacts.length;
        count -=3;
        if(count<0)
            count = 0;
        showPageCover(16);
    }

    $scope.$on('referenceDocCancelDoc',function(event,data){
        cancelDoc();
    });

    $scope.$on('referenceDoc',function(event,data){
        if($scope.newReference.link.match(/\\/g))
            alert('link 中不能包含\\符号。')
        let updateQuery = JSON.parse(JSON.stringify($scope.newReference));
        let accountId= $rootScope.project.account? $rootScope.project.account._id : null;
        updateQuery.project  = updateQuery.project? $rootScope.project._id :null;
        updateQuery.source = Number(updateQuery.source);
        dataManager.saveData('docs','new reference saved',updateQuery);
    });


    $scope.$on('new reference saved',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.resetReference();
            $scope.referenceDocs.push(data.result);
            cancelDoc();
        }
    });

    $scope.showProjectContacts = function(){
        if($scope.statusReset){
            $scope.statusReset = false;
            return;
        }
        $rootScope.submitType = 'projectContacts';
        let innerHTML = '<div style="display:flex;flex-direction:column;padding:1.5rem;" id="contactWindow">' +
            '<div style="margin-left:auto;margin-bottom:1rem;" ng-if="accountLink"><a href="{{accountLink}}" target="_blank">Check Account</a></div>'+
            '<div><div>Primary Contact:</div><div style="display:flex;flex-direction:row;" ng-repeat="contact in project.projectContacts" ng-if="$index<1"><div class="singleLine" style="padding:0;height:1.2rem;min-width:22rem;">{{contact.name}} <{{contact.mail}}></div><button ng-click="detail(contact)">DETAIL</button></div></div>' +
            '<div><div>Secondary Contact:</div>' +
            '<div><div class="singleLine" style="display:flex;flex-direction:row;" ng-repeat="contact in project.projectContacts" ng-if="$index===1"><div class="singleLine">{{contact.name}} <{{contact.mail}}></div><button ng-click="mailTo(contact)">MAIL</button></div></div>' +
            '</div><div>' +
            '<div>Other Contacts:</div>' +
            '<div>' +
            '<div style="display:flex;flex-direction:row;" ng-repeat="contact in project.projectContacts" ng-if="$index>1"> <div class="singleLine">{{contact.name}} <{{contact.mail}}></div><button ng-click="mailTo(contact)">MAIL</button></div>'+
            '</div></div>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        let count = $rootScope.project.projectContacts.length;
        count -=3;
        if(count<0)
            count = 0;
        showPageCover(14 + count*2, 42);
    }

    $scope.$watch('projectDetail.active',function(newVal,oldVal){
        if($scope.statusReset){
            $scope.statusReset = false;
            return;
        }
        let innerHTML = '<div style="margin-top:1rem;margin-bottom:1rem;width:calc(100% - 3rem);margin-left:auto;margin-right:auto;">'
            +'Do you wish to set the project status to '
            + projectStatus($scope.projectDetail.active)+
            '?</div>';
        let element = document.getElementById('coverDetail');
        if(element)
            element.innerHTML = innerHTML;
        $rootScope.submitType = 'projectActive';
        showPageCover(8);
    });

    $scope.$on('projectActiveCancelDoc',function(event,data){
        $scope.resetStatus();
        cancelDoc();
    });

    $scope.$on('projectContactsCancelDoc',function(event,data){
        cancelDoc();
    });

    $scope.$on('project active updated',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            let contacts = JSON.stringify($rootScope.project.contacts);
            let projectContacts = JSON.stringify($rootScope.project.projectContacts);
            $rootScope.project = data.result;
            $rootScope.contacts = JSON.parse(contacts);
            $rootScope.projectContacts = JSON.parse(projectContacts);
            $rootScope.$broadcast('project Updated',null);
        }
        cancelDoc();
    });

    $scope.$on('current release received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            let result = data.result;
            $rootScope.currentRelease = {};
            if(Array.isArray(result) && result.length >0 ){
                result = result[0];
                $rootScope.currentRelease.title = result.version.main+'.'+result.version.update+'.'+result.version.fix;
                $rootScope.currentRelease.description = result.description;
            }else{
                $rootScope.currentRelease.title = 'no release found';
            }

        }
    });

    $scope.$on('updateProjectActive',function(){
        if($scope.projectDetail.active === '-1'){
            cancelDoc();
            return;
        }
        let updateQuery = {_id:$rootScope.project._id,status:Number($scope.projectDetail.active),populate:'account delivery'};
        if(updateQuery.status === 5){
            updateQuery.schedule = new Date(Date.now());
            updateQuery.schedule.setFullYear(updateQuery.schedule.getFullYear()+1000);
        }
        dataManager.saveData('project','project active updated', updateQuery);
    });

    $scope.$on('project info updated',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $rootScope.project = data.result;
            $rootScope.$broadcast('project info changed',null);
        }
    });

    $scope.$on('reference requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.referenceDocs  = data.result;
        }
    });

    $scope.initialize = function(){
        $scope.resetStatus();
        $scope.resetReference();
        let search = {project:$rootScope.project._id};
        let cond = {sort:{date:-1},limit:1};
        let accountId = $rootScope.project.account? $rootScope.project.account._id : null;
        let project = [null];
        project.push($rootScope.project._id);
        dataManager.requestData('docs','reference requested',{type:5,account:accountId,project:{$in:project}});
        dataManager.requestData('version','current release received',{search:search,cond:cond});
        setTimeout(function(){
            $scope.initialized = true;
        },10);
    }

    $scope.initialize();
});
