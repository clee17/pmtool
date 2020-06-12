app.controller("docCon",function($scope,$rootScope,$compile,dataManager) {
    $scope.docs = [];
    $scope.newContract = {
        name:"",
        type:"0",
        source:"0",
        reference:"",
        description:"",
        link:""
    }

    $scope.types =[
        {value:"0",name:"NDA"},
        {value:"1",name:"SOW"},
        {value:"2",name:"SLA"}
    ];

    $scope.saveDoc = null;

    $scope.$watch('newContract',function(newVal,oldVal){
        if($rootScope.submitType === 'contracts' && $scope.newContract)
            $scope.saveDoc = JSON.parse(JSON.stringify($scope.newContract));
    },true);

    $scope.edit = function(doc){
        if(!$scope.saveDoc){
            $scope.saveDoc = JSON.parse(JSON.stringify($scope.newContract));
        }
        $scope.newContract = JSON.parse(JSON.stringify(doc));
        if(typeof $scope.newContract.type === 'number')
            $scope.newContract.type = $scope.newContract.type.toString();
        if(typeof $scope.newContract.source === 'number')
            $scope.newContract.source = $scope.newContract.source.toString();
        $scope.showCoverContents('editContract');
    };

    $scope.showCover = function(type){
        $scope.newContract = $scope.saveDoc? JSON.parse(JSON.stringify($scope.saveDoc)) : {
            name:"",
            type:"0",
            source:"0",
            reference:"",
            description:"",
            link:""
        };

        if($scope.saveDoc)
            $scope.saveDoc = null;
        $scope.showCoverContents(type);
    };

    $scope.$on('contracts',function(event,data){
        let saveQuery = JSON.parse(JSON.stringify($scope.newContract));
        if(saveQuery.name === ''){
            alert('You must specify the name for your document.');
            return;
        }else if(saveQuery.description === ""){
            alert('you must add some comments for your document');
            return;
        }

        saveQuery.source = Number(saveQuery.source);
        saveQuery.type = Number(saveQuery.type);
        saveQuery.account = $rootScope.project.account._id;
        saveQuery.project = $rootScope.project._id;
        saveQuery.populate = 'parent';

        $rootScope.saving = true;
        if(saveQuery.source === 0){
            let formData = new FormData()
            let upload = document.getElementById('fileUpload');
            let files = [];
            if(upload && upload.files)
                files = upload.files;
            if(files.length<=0){
                alert('please upload your doc accordingly');
                return;
            }
            formData.append('file', files[0]);
            formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(saveQuery))));
            dataManager.uploadFile('/upload/docs', 'new contract saved',formData);
        }else{
            dataManager.saveData('docs','new contract saved', saveQuery);
        }
    })

    $scope.$on('new contract saved',function(event,data){
        $rootScope.saving = false;
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs.unshift(data.result);
            cancelDoc();
        }
    });

    $scope.$on('contractsCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    });

    $scope.$on('editContractCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    });

    $scope.$on('contracts requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.docs = data.result;
        }
    });

    $scope.showCoverContents = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>name:</td><td><input style="width:12rem" ng-model="newContract.name"></td></tr>'+
            '<tr><td>type:</td>' +
            '<td><select ng-model="newContract.type" style="width:10rem;" ng-options="type.value as type.name for type in types"></select></td></tr>' +
            '<tr><td>source:</td><td><select style="width:6rem;" ng-model="newContract.source" ng-options="source.value as source.name for source in sources"></select></td></tr>'+
            '<tr><td>link:</td><td>' +
            '<input style="width:12rem" ng-model="newContract.link" ng-show="newContract.source !=='+ "'0'"+'">' +
            '<input  id="fileUpload" style="width:12rem" type=file ng-show="newContract.source === ' +"'0'"+'">' +
            '</td></tr>'+
            '<tr><td>description:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newContract.description"></textarea></td></tr>'+
            '<tr><td>reference:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newContract.reference"></textarea></td></tr>'+
            '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(24);
    };

    $scope.initialize = function(){
        let data = [
            { $match:{$expr:{$and:[{$eq:[{$toObjectId: $rootScope.project._id} ,"$project"]},{$lte:["$type",2]}]}}},
            { $lookup:{from:"doc",localField:"_id",foreignField:"parent",as:"draft"}},
        ];
        dataManager.requestAggregateData('docs','contracts requested', data);
    }

    $scope.initialize();
});