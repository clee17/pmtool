app.controller("purchaseCon",function($scope,$rootScope,$compile,$filter,$timeout,dataManager) {
    $scope.POs = [];
    $scope.addPO = null;
    $scope.deletePO = null;
    $scope.newPO = null;

    $scope.resetPO =function(){
        $scope.newPO = {
            index:"",
            amount:"",
            price:"0",
            comment:"",
            currency:"0",
            docs:[]
        };
    };

    $scope.newDocument = {
        name:"",
        type:"0",
        description:"",
        source:"0",
        reference:"",
        link:""
    }


    $scope.$watch('newPO',function(){
        if($rootScope.submitType === 'purchase')
            $scope.addPO = JSON.parse(JSON.stringify($scope.newPO));

        let element = document.getElementById('coverDetail');
        if(element){
            let height = element.style.height;
            height = height.substring(0,height.indexOf('rem'));
            if(Number(height)>=20)
                element.style.height = '18rem';
        }
    },true);

    $scope.edit = function(payment){
        $scope.paymentEditable = payment;
        $scope.newPayment = JSON.parse(JSON.stringify(payment));
        $scope.newPayment._id = payment._id;
        $scope.newPayment.currency = $scope.newPayment.currency.toString();
        $scope.newPayment.status = payment.status !== undefined ? payment.status.toString(): "0";
        $scope.newPayment.invoice =  '0';
        $scope.newPayment.payment =  '0';
        $scope.newPayment.doc = '0';
        $scope.newPayment.invoiceList = payment.invoice;
        $scope.newPayment.docList = payment.doc;
        $scope.newPayment.paymentList = payment.payment;
        $scope.showCoverContents('editPayment');
    };

    $scope.delete = function(payment){
        $rootScope.submitType = 'deletePayment';
        let innerHTML = '<div style="text-indent:2rem;font-size:1.2rem;">Are you sure you want to delete the payment <b>' +
            payment.PO +'</b>of <b>'+payment.amount +  $filter('currency')(payment.currency,'icon')+'</b>?'+
            '</div>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(8);
    }


    $scope.showCover = function(type){
        if($scope.addPO){
            $scope.newPO = JSON.parse(JSON.stringify($scope.addPO));
            $scope.addPO = null;
        }
        $scope.showCoverContents(type);
    }

    /*                EDIT and Delete Payment

    * */

    $scope.$on('editPayment',function(){
        let updateQuery = {};
        updateQuery._id = $scope.newPayment._id;
        updateQuery.PO = $scope.newPayment.PO;
        updateQuery.account = $scope.newPayment.account? $scope.newPayment.account._id: null;
        updateQuery.amount = $scope.newPayment.amount;
        updateQuery.comment = $scope.newPayment.comment;
        updateQuery.status = Number($scope.newPayment.status);
        updateQuery.currency = Number($scope.newPayment.currency);
        delete updateQuery.invoice;
        delete updateQuery.doc;
        dataManager.updateData('payment','payment added', updateQuery);
    });

    $scope.$on('editPaymentCancelDoc',function(){
        $scope.resetPO();
        delete $scope.newPayment._id;
        cancelDoc();
    })

    $scope.$on('deletePayment',function(){
        for(let i=0; i<$scope.payments.length;++i){
        }
    });

    $scope.$on('deletePaymentCancelDoc',function(){
        $scope.deletePayment = null;
        cancelDoc();
    })

    /*                ADD Payment

    * */

    $scope.$on('addPayment',function(){
        if($scope.newPayment.PO.length === 0){
            alert('PO 不能为空');
            return;
        }else if($scope.newPayment.comment.length === 0) {
            alert('说明不能为空');
            return;
        }else  if($scope.newPayment.status !== '0' && $scope.newPayment.invoice === '0'){
            alert('该状态下invoice不能为空');
            return;
        }else if($scope.newPayment.amount < 0 ){
            alert('付款数量不能为空');
            return;
        }

        let updateQuery = JSON.parse(JSON.stringify($scope.newPayment));
        updateQuery.status = Number(updateQuery.status);
        updateQuery.date = Date.now();
        updateQuery.project = $rootScope.project._id;
        updateQuery.account = $rootScope.project.account._id;
        updateQuery.invoice = updateQuery.invoice === '0' ? null : updateQuery.invoice;
        updateQuery.populate = 'invoice account';

        delete updateQuery.invoice;
        delete updateQuery.doc;
        delete updateQuery.payment;
        delete updateQuery.docList;
        delete updateQuery.paymentList;
        delete updateQuery.invoiceList;
        console.log(updateQuery);
        dataManager.saveData('payment','payment added', updateQuery);
    });

    $scope.$on('payment added',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            data.result.invoice = [];
            data.result.doc = [];
            let insert = true;
            for(let i= 0 ; i<$scope.payments.length;++i) {
                if($scope.payments[i]._id === data.result._id){
                    $scope.payments[i] = JSON.parse(JSON.stringify(data.result));
                    insert = false;
                }
            }
            if(insert)
                $scope.payments.push(data.result);
            dataManager.deleteMany('paymentDocs','paymentDoc refreshed', {search:{project:$rootScope.project._id,payment:data.result._id},index:'paymentDocs'});
        }
    });

    $scope.$on('paymentDoc refreshed',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            for(let i=0; i<$scope.newPayment.docList.length;++i){
                let doc = {
                    project: $rootScope.project._id,
                    payment:$scope.newPayment._id,
                    doc: $scope.newPayment.docList[i]._id,
                    type:1
                }
                dataManager.saveData('paymentDocs','payment doc added', doc);
            }
            for(let i=0; i<$scope.newPayment.invoiceList.length;++i){
                let invoice = {
                    project: $rootScope.project._id,
                    payment: $scope.newPayment._id,
                    doc: $scope.newPayment.invoiceList[i]._id,
                    type: 0
                }
                dataManager.saveData('paymentDocs','payment doc added', invoice);
            }

            for(let i=0; i<$scope.newPayment.paymentList.length;++i){
                let invoice = {
                    project: $rootScope.project._id,
                    payment: $scope.newPayment._id,
                    doc: $scope.newPayment.invoiceList[i]._id,
                    type: 2
                }
                dataManager.saveData('paymentDocs','payment doc added', invoice);
            }
            $scope.resetPO();
            cancelDoc();
        }
    })

    $scope.$on('payment doc added',function(event,data){
        if(!data.success)
            return;
        if(!data.result)
            return;
        let attr = 'doc';
        switch(data.result.type){
            case 0:
                attr=  'doc';
                break;
            case 1:
                attr = 'invoice';
                break;
            case 2:
                attr = 'payment';
                break;
        }
        for(let i=0;i<$scope.payments.length;++i){
            if(data.result.payment === $scope.payments[i]._id)
                $scope.payments[i][attr].push(data.result);
        }
    });

    $scope.$on('PurchaseCancelDoc',function(){
        cancelDoc();
    });

    $scope.cancelNewDocument = function(){
        let element = document.getElementById('documentLayer');
        if(!element)
            return;
        element.style.opacity = '0';
        $timeout(function(){
            let element = document.getElementById('documentLayer');
            if(!element)
                return;
            document.body.removeChild(element);
            $scope.documentLayerbooted = false;
        },400);
    }

    $scope.submitNewDocument =function(){
        let newDcoument = JSON.parse(JSON.stringify($scope.newDocument));
        newDocument.source = Number(newDocument.source);
        if(newDocument.source === 0){
           $rootScope.uploadDoc(newDocument);
        }else{
            $rootScope.saveDoc(newDocument);
        }
    }



    $scope.addNewDocument = function(signal){
        if($scope.documentLayerbooted)
            return;
        $scope.newDocumentSignal = signal;
        let layer = document.createElement('div');
        $scope.documentLayerbooted = true;
        layer.style.display = 'flex';
        layer.style.width = '100%';
        layer.style.height = '0';
        layer.style.position = 'fixed';
        layer.style.left = '0';
        layer.style.top = '0';
        layer.style.transition = 'opacity 0.2s,height 0.2s';
        layer.style.background = 'rgba(185,185,185,0.6)';
        layer.style.opacity = '0';
        layer.id = 'documentLayer';
        let newDocument = '<div style="margin:auto;display:flex;flex-direction:column;background:white;width:24rem;height:22rem;border-radius:1.2rem;">' +
            '<table class="pageCoverTable" style="margin-left:2rem;margin-right:auto;margin-top:2rem;">' +
            '<tr><td>文件名称</td><td style="padding-left:2rem;"><input id="nameInput" ng-model="newDocument.name" style="width:12rem;"></td></tr>'+
            '<tr><td>文件类型</td><td style="padding-left:2rem;">' +
            '<select ng-model="newDocument.type">' +
            '<option value="0">NDA(保密协议)</option>' +
            '<option value="1">SOW(工作内容确认书)</option>' +
            '<option value="2">SLA(合同与合同修订)</option>' +
            '<option value="3">Royalty(季度产量报告)</option>' +
            '<option value="4">Invoice(财务收据)</option>' +
            '<option value="6">Payment(入账凭证)</option>' +
            '<option value="5">reference(参考文章)</option></select></td></tr>'+
            '<tr><td>文件描述</td><td style="padding-left:2rem;"><textarea ng-model="newDocument.description" style="height:4rem;width:12rem;"></textarea></td> </tr>' +
            '<tr><td>文件来源</td><td style="padding-left:2rem;"><select id="sourceSelect"  ng-model="newDocument.source">' +
                '<option value="0">assets</option>' +
                '<option value="1">online</option>' +
                '<option value="2">fileserver</option></select></td></tr>' +
            '<tr><td>文件地址</td><td style="padding-left:2rem;">' +
            '<input id="linkInput" ng-model="newDocument.link" ng-show="newDocument.source === \'1\' || newDocument.source === \'2\' ">' +
            '<form encType="multipart/form-data" action="/upload/docs" ng-show="newDocument.source == \'0\' ">' +
            '<input id="fileName" style="display:none;">' +
            '<input id="fileUpload" style="display:block;" type="file">' +
            '<input id="fileSubmit" style="display:none;" type="submit" value="Submit">' +
            '</form></td></tr>'+
            '<tr><td>参考信息</td><td style="padding-left:2rem;"><textarea id="referenceInput" style="height:4rem;width:12rem;"></textarea></td></tr>' +
            '</table>' +
            '<div style="margin-left:auto;margin-right:auto;margin-top:1rem;"><button style="margin-right:3rem;" ng-click="submitNewDocument()">确定</button><button ng-click="cancelNewDocument()">取消</button></div>'
            '</div>';
        let node = $compile(newDocument)($scope);
        document.body.appendChild(layer);
        layer = angular.element(layer);
        layer.append(node);
        $timeout(function(){
            let element = document.getElementById('documentLayer');
            if(!element)
                return;
            element.style.opacity = '1';
            element.style.height = '100%';
        },100)
    };

    $scope.showCoverContents = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>PO number:</td><td><input style="width:12rem" ng-model="newPO.index"></td></tr>'+
            '<tr><td>amount:</td><td><input type="number" ng-model="newPO.amount" style="width:6rem;margin-right:0.5rem;">' +
            '<tr><td>Price:</td><td><input type="number" ng-model="newPO.price" style="width:6rem;margin-right:0.5rem;">' +
            '<select ng-model="newPO.currency" ng-options="currency.value as currency.icon for currency in currencies"></select></td></tr>'+
            '<tr><td>Documents:</td><td style="text-align:right;"><button style="margin-right:2rem;" ng-click="addNewDocument()">ADD</button></td></tr>'+
            '<tr><td colspan="2" style="display:flex;flex-direction:column;padding-left:1.5rem;">' +
            '<div ng-show="newPO.docs.length ===0">no documents</div>'+
            '<div ng-repeat="doc in newPO.docs"><img src="{{doc | docIcon}}" style="width:1.2rem;"><span>{{doc.name}}</span></div>' +
            '</td></tr>'+
            '<tr><td>comment:</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;height:5rem;" ng-model="newPO.comment"></textarea></td></tr>'+
            '</td></tr>'
        '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(22 + $scope.newPO.docs.length*1.5);
    };


    /*               Initialize Controller data;

    * */

    $scope.$on('payments requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.payments = data.result;
            $rootScope.$broadcast('alert payments updated',data.result);
        }
    });

    $scope.$on('docs requested',function(event,data){
        if(!data.success){
            alert(data.message);
        }else{
            $scope.invoiceList = [
                {_id:"0",name:"ADD INVOICE"}
            ];
            $scope.docs = [
                {_id:"0",name:"ADD DOCUMENT"}
            ];

            for(let i=0;i<data.result.length;++i){
                if(data.result[i].type === 4)
                    $scope.invoiceList.push(data.result[i]);
                else if(data.result[i].type <=3 && data.result[i].type >=2)
                    $scope.docs.push(data.result[i]);
            }
            if($scope.invoiceList.length === 1)
                $scope.invoiceList = [
                    {_id:"0",name:"NO INVOICE"}
                ];
            if($scope.docs.length === 1)
                $scope.docs = [
                    {_id:"0",name:"NO DOCUMENT"}
                ];
        }
    });

    $scope.$on('collection requested',function(event,data){
        $scope.paymentList = [
            {_id:"0",title:"ADD PAYMENT"}
        ];

        if(data.success){
            for(let i=0;i<data.result.length;++i){
                let record = data.result[i];
                record.title = record.amount + '__'+$filter('date')(record.date);
                $scope.paymentList.push(data.result[i]);
            }
        }

        if($scope.paymentList.length === 1)
            $scope.paymentList = [
                {_id:"0",title:"NO PAYMENT"}
            ];

        if(!data.success)
            alert(data.message);
    });

    $scope.initialize = function(){
        let data = [
            { $match:{$expr:{$and:[{$eq:[{$toObjectId: $rootScope.project._id} ,"$project"]}]}}},
            {$sort:{date:-1}},
            {$lookup:{from:"account",localField:"account",foreignField:"_id",as:"account"}},
            {$unwind:"$account"},
            {$lookup:{  from: "paymentDocs",
                    let: {paymentId: "$_id"},
                    pipeline: [
                        {$match:{$expr:{$and:[{$eq: ["$type",0]}, {$eq:["$$paymentId", "$payment"]}]}}},
                        {$lookup:{from:'doc',localField:'doc',foreignField:"_id",as:"doc"}},
                        {$unwind:"$doc"},
                        {$replaceRoot: { newRoot: "$doc" } },
                    ],
                    as: "invoice"}},
            {$lookup:{  from: "paymentDocs",
                    let: {paymentId: "$_id"},
                    pipeline: [
                        {$match:{$expr:{$and:[{$eq: ["$type",1]}, {$eq:["$$paymentId", "$payment"]}]}}},
                        {$lookup:{from:'doc',localField:'doc',foreignField:"_id",as:"doc"}},
                        {$unwind:"$doc"},
                        {$replaceRoot: { newRoot: "$doc" } },
                    ],
                    as: "doc"}},
            {$lookup:{  from: "paymentDocs",
                    let: {paymentId: "$_id"},
                    pipeline: [
                        {$match:{$expr:{$and:[{$eq: ["$type",2]}, {$eq:["$$paymentId", "$payment"]}]}}},
                        {$lookup:{from:'doc',localField:'doc',foreignField:"_id",as:"doc"}},
                        {$unwind:"$doc"},
                        {$replaceRoot: { newRoot: "$doc" } },
                    ],
                    as: "payment"}}
        ];
        $scope.resetPO();
        dataManager.requestAggregateData('payment','payments requested', data);
        dataManager.requestData('docs','docs requested', {project:$rootScope.project._id, type: {$in:[2,3,4]}});
        dataManager.requestData('collection','collection requested',{account:$rootScope.project.account});
    }

    $scope.initialize();
});