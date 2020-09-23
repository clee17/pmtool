app.controller("releaseCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.addDeveloper = "0";
    $rootScope.versions = [];
    $scope.newRelease = {
        developers:[],
        toBeSaved:[],
        position:"",
        source:"0",
        description:"",
        priority:"1",
        version:{
            main:1,
            update:0,
            fix:0
        }
    }

    $scope.expandData = function(event){
        let target = event.target;
        if(target.nodeName === 'I')
            target = target.parentNode;
        let targetElement =angular.element(target);
        let visible = target.children[0].className === 'fa fa-angle-up';
        let root = target;
        while(root.className.indexOf("entry")<0){
            root = root.parentElement;
            if(!root)
                break;
        }
        if(visible){
            let contents = root.children[1];
            let original = contents.children[0];
            original.style.height = '1.5rem';
            targetElement.html('<i class="fa fa-angle-down"></i>');
        }else{
            let contents = root.children[1];
            let original = contents.children[0];
            let newDiv  = document.createElement('DIV');
            if(newDiv)
                newDiv.innerHTML = contents. innerHTML;
            newDiv.style.width = contents.style.width;
            newDiv.style.position = "absolute";
            newDiv.style.left = '0';
            newDiv.style.right = '0';
            root.appendChild(newDiv);
            newDiv.style.opacity = '0';
            original.style.height = newDiv.scrollHeight+'rem';
            original.style.webkitLineClamp = '100';
            root.removeChild(newDiv);
            targetElement.html('<i class="fa fa-angle-up"></i>');
        }
    }

    $scope.newDeveloper = function(){
        if($scope.addDeveloper === '0')
            return;
        if($scope.newRelease.toBeSaved.indexOf($scope.addDeveloper)>=0){
            alert('不能重复添加开发人员');
            return;
        }
        let user = {_id:$scope.addDeveloper};
        for(let i=0; i<$scope.developers.length;++i){
            if($scope.developers[i]._id === $scope.addDeveloper){
                $scope.newRelease.developers.push($scope.developers[i]);
                $scope.newRelease.toBeSaved.push($scope.addDeveloper);
                $scope.addDeveloper = "0";
                break;
            }
        }
    };

    $scope.removeDeveloper = function(id){
        if($scope.newRelease.toBeSaved.indexOf(id)<0 ){
            return;
        }
        let developers = $scope.newRelease.developers;
        for(let i =0; i< developers.length;++i){
            if(developers[i]._id === id){
                developers.splice(i,1);
                break;
            }
        }
        let TBS =  $scope.newRelease.toBeSaved;
        TBS.splice(TBS.indexOf(id),1);
    }


    $scope.$watch('newRelease.toBeSaved.length',function(newVal,oldVal){
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0)
            elements[0].style.height = 20+newVal*1.8+'rem';
    });

    $scope.$on('releaseCancelDoc',function(event,data){
           cancelDoc();
    });

    $scope.showCover = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>Release Version:</td><td><input style="width:2rem" ng-model="newRelease.version.main">:<input style="width:3rem;" ng-model="newRelease.version.update">:<input style="width:4rem;" ng-model="newRelease.version.fix"></td></tr>'+
            '<tr><td >File:</td><td><input type=file id="fileUpload"></td></tr>' +
            '<tr><td>Developers:</td>' +
            '<td style="display:flex;flex-direction:row;height:2rem;">' +
            '<select ng-model="addDeveloper" style="margin-top:auto;margin-bottom:auto;" ng-options="developer._id as developer.name for developer in developers"></select>' +
            '<button class="simpleBtn" style="margin-left:1.5rem;" ng-show="addDeveloper != \'0\'" ng-click="newDeveloper()">ADD</button></td></tr>' +
            '<tr ng-repeat="developer in newRelease.developers" ><td colspan="2">' +
            '<button style="margin-right:1rem;" class="simpleBtn" ng-click="removeDeveloper(developer._id)">×</button><span style="margin-right:2rem;">{{developer.name}}</span><span>{{developer.mail}}</span>'+
            '</td></tr>'+
            '<tr><td>Priority:</td><td><select style="width:4rem;"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td></tr>'+
            '<tr><td>Description:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newRelease.description"></textarea></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(20);
    };

    $scope.$on('developers received',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.developers = data.result;
            $scope.developers.unshift({_id:"0",name:"请选择开发人员"});
        }
    });

    $scope.$on('addRelease',function(event,data){
        $rootScope.saving = true;
        let updateSave = JSON.parse(JSON.stringify($scope.newRelease));
        updateSave.developers = updateSave.toBeSaved;
        delete updateSave.toBeSaved;
        updateSave.version.main = Number(updateSave.version.main);
        updateSave.version.udpate = Number(updateSave.version.update);
        updateSave.version.fix = Number(updateSave.version.fix)
        updateSave.date = Date.now();
        updateSave.priority = Number(updateSave.priority);
        updateSave.project = $rootScope.project._id;
        delete updateSave.source;
        delete updateSave.position;
        $scope.updateSave = JSON.parse(JSON.stringify(updateSave));
        let searchField = {
            project:updateSave.project,
            "version.main":updateSave.version.main,
            "version.update":updateSave.version.update,
            "version.fix":updateSave.version.fix
        }
        dataManager.requestData('version','search version existed',searchField);
    });

    $scope.$on('search version existed',function(event,data){
        if(!data){
            alert('data is null');
        }else if(!data.success){
            alert(data.message);
        }else {
            if(data.result.length > 0) {
                $rootScope.saving = false;
                alert('该版本已经存在，请修改信息。');
            }else{
                let dataDetail = {project:$scope.updateSave.project,search:$scope.updateSave,updateExpr:{updated:Date.now()}};
                let formData = new FormData();
                let upload = document.getElementById('fileUpload');
                let files = [];
                if(upload && upload.files)
                    files = upload.files;
                if(files.length<=0){
                    alert('you must upload a release file');
                    return;
                }
                formData.append('file', files[0]);
                formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(dataDetail))));
                formData.append('origin','1');
                formData.append('type','11');
                formData.append('filename',$scope.updateSave.version.main+'.'+$scope.updateSave.version.update+'.'+$scope.updateSave.version.fix);
                dataManager.uploadFile('/upload/version','version saved',formData)
            }
        }
    });

    $scope.$on('version position saved',function(event,data){
        if(!data){
            alert ('version position received null data');
        }else if(!data.success){
            alert(data.message);
        }else{
            $scope.updateSave.position = data.result._id;
            delete $scope.updateSave.source;
            $scope.updateSave.populate = 'position';
            dataManager.saveData('version','version saved',$scope.updateSave);
        }
    });


    $scope.$on('version saved',function(event,data){
        $rootScope.saving = false;
        $scope.updateSave = null;
        if(!data){
            alert('data is null');
        }else if(!data.success){
            alert(data.message);
        }else {
            $scope.newRelease.version = {main:data.result.version.main,update:data.result.version.update,fix:data.result.fix+3};
            $scope.newRelease.description = "";
            $scope.newRelease.toBeSaved = $scope.newRelease.developers = [];
            $rootScope.versions.push(data.result);
            cancelDoc();
        }
    });

    $scope.$on('versions received',function(event,data){
        if(!data){
            alert('failed to retrieve historic versions.');
        }else if(!data.success){
            alert(data.message);
        }else {
            $rootScope.versions = data.result;
            $rootScope.$broadcast('versions updated',null);
        }
    });


    $scope.initialize = function(){
        let data = {};
        let regExp = new RegExp("R&D","i");
        data.search = {department:{$regex: {value:"R&D",cond:"i"}}};
        data.cond = {sort:{name:1}};
        dataManager.requestData('user','developers received',data);
        dataManager.requestData('version','versions received',{search:{project:$rootScope.project._id},populate:'position'});
    }

    $scope.initialize();
});