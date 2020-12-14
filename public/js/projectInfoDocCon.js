app.controller("docCon",function($scope,$rootScope,$compile,$http,dataManager) {
    $scope.docs = [];
    $scope.newContract = {
        name:"",
        type:"0",
        source:"0",
        reference:"",
        description:"",
        link:"",
        originalLink:"",
        originalDate:Date.now(),
        _id:""
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

    $scope.modify = function(doc){
        if(!$scope.saveDoc){
            $scope.saveDoc = JSON.parse(JSON.stringify($scope.newContract));
        }
        if(!doc.source)
            doc.source = 0;
        $scope.newContract.source = doc.source.toString();
        $scope.newContract.type = doc.type;
        $scope.newContract.link = doc.link;
        $scope.newContract._id = doc._id;
        $scope.newContract.project = doc.project;
        $scope.newContract.originalLink = $scope.newContract.link = doc.link;
        $scope.newContract.originalDate = doc.date;
        $scope.showCoverContents('modifyDocument');
    };

    $scope.deleteDocument = function(doc){
        $scope.docTobeDeleted = doc;
        $scope.showCoverContents('deleteDocument');
    }

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

    $scope.$on('deleteDocument',function(event,data){
        if($scope.docDeleting)
            return;
        $scope.docDeleting = true;
        dataManager.deleteDoc($scope.docTobeDeleted._id);
    });

    $scope.$on('modifyDocument',function(event,data) {
        let updateQuery = {search: {}, updateExpr: {},original:{}};
        updateQuery.search._id = $scope.newContract._id;
        updateQuery.search.type = $scope.newContract.type;
        updateQuery.search.project = $scope.newContract.project;
        updateQuery.updateExpr.source = Number($scope.newContract.source);
        updateQuery.updateExpr.link = $scope.newContract.link;
        updateQuery.updateExpr.modified = Date.now();
        updateQuery.updateExpr.history = {$push:{link:$scope.newContract.originalLink,date:$scope.newContract.originalDate}};
        updateQuery.original.link = $scope.newContract.originalLink;
        if($scope.newContract.source === '0'){
            let formData = new FormData()
            let upload = document.getElementById('fileUpload');
            let files = [];
            if(upload && upload.files)
                files = upload.files;
            if(files.length<=0){
                dataManager.updateData('docs', 'contract finalized', updateQuery);
                return;
            }
            formData.append('file', files[0]);
            formData.append('origin','1');
            formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(updateQuery))));
            if(updateQuery.original.link.length === 0){
                dataManager.uploadFile('upload/docs', 'contract finalized',formData);
            }else{
                dataManager.replaceFile('docs', 'contract finalized',formData);
            }
        }else{
            if($scope.newContract.link.length <=0){
                alert('a website must be provided');
                return;
            }else if($scope.newContract.link === updateQuery.original.link){
                alert(' you must provide a new link ');
                return;
            }
            $http({method:'GET',url:$scope.newContract.link})
                .then(function success(response, status, headers, config){
                    if(status !== 404)
                       dataManager.updateData('docs', 'contract finalized', updateQuery);
                    else
                        alert('You must provide an valid link');
                },function error(response){
                    alert('you must provide an valid link');
                });
        }
    });

    $scope.$on('contracts',function(event,data){
        let saveQuery = JSON.parse(JSON.stringify($scope.newContract));
        delete saveQuery._id;
        delete saveQuery.originalLink;
        delete saveQuery.originalDate;
        if(saveQuery.name === ''){
            alert('You must specify the name for your document.');
            return;
        }else if(saveQuery.description === ""){
            alert('you must add some comments for your document');
            return;
        }

        saveQuery.source = Number(saveQuery.source);
        saveQuery.type = Number(saveQuery.type)+1;
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
                alert('you must provide at least one document for the file');
                return;
            }
            formData.append('file', files[0]);
            formData.append('origin','1');
            formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(saveQuery))));
            dataManager.uploadFile('/upload/docs', 'new contract saved',formData);
        }else{
            dataManager.saveData('docs','new contract saved', saveQuery);
        }
    })

    $scope.$on('contract finalized',function(event,data){
        $rootScope.saving = false;
        if(!data.success){
            alert(data.message);
        }else{
            console.log(data);
        };
    });

    $scope.$on('new contract saved',function(event,data){
        $rootScope.saving = false;
        if(!data.success){
            alert(data.message);
        }else{
            if(!data.result.draft)
                data.result.draft = [];
            $scope.docs.unshift(data.result);
            cancelDoc();
        }
    });


    $scope.$on('contract finalized',function(event,data){
        $rootScope.saving = false;
        console.log(data);
    })

    $scope.$on('contractsCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    });

    $scope.$on('modifyDocumentCancelDoc',function(event,data){
        if($rootScope.saving)
            return;
        cancelDoc();
    })

    $scope.$on('deleteDocumentCancelDoc',function(event,data){
        $scope.docTobeDeleted = null;
        cancelDoc();
    })

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

    $scope.$on('document deleted',function(event,data){
        $scope.docDeleting = false;
        console.log(data);
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
        if(type === 'modifyDocument'){
            innerHTML = '<table class="pageCoverTable">' +
                '<tr><td>source:</td><td><select style="width:6rem;" ng-model="newContract.source" ng-options="source.value as source.name for source in sources"></select></td></tr>'+
                '<tr><td>link:</td><td>' +
                '<input style="width:12rem" ng-model="newContract.link" ng-show="newContract.source !=='+ "'0'"+'">' +
                '<input  id="fileUpload" style="width:12rem" type=file ng-show="newContract.source === ' +"'0'"+'">' +
                '</td></tr>'+
                '</table>';
        }else if(type === 'deleteDocument'){
            let name = $scope.docTobeDeleted.name;
            innerHTML = '<div>Please double confirm that if you do wish to delete the document <b>'+name +'</b>(including all history records)?</div>'
        }
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        let height = 24;
        if(type === 'modifyDocument')
            height = 9.5;
        else if(type === 'deleteDocument')
            height = 12;
        showPageCover(height);
    };

    $scope.initialize = function(){
        let data = [
            { $match:{$expr:{$and:[{$eq:[{$toObjectId: $rootScope.project._id} ,"$project"]},{$eq:[null,"$parent"]},{$lte:["$type",2]}]}}},
            { $lookup:{from:"doc",localField:"_id",foreignField:"parent",as:"draft"}},
        ];
        dataManager.requestAggregateData('docs','contracts requested', data);
    }

    $scope.initialize();
});