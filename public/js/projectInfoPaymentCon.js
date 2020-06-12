app.controller("paymentCon",function($scope,$rootScope,$compile,$filter,dataManager) {
    $scope.payments = [];
    $scope.invoiceList = [];
    $scope.docs = [];
    $scope.addPayment = null;
    $scope.deletePayment = null;

    $scope.resetPayment =function(){
        $scope.newPayment = {
            PO:"",
            status:"0",
            comment:"",
            invoice:"0",
            doc:"0",
            amount:"",
            currency:"0"
        };
    };

    $scope.$watch('newPayment',function(newVal, oldVal){
        if($rootScope.submitType === 'payment')
            $scope.addPayment = JSON.parse(JSON.stringify($scope.newPayment));
    },true);

    $scope.edit = function(payment){
        $scope.newPayment = JSON.parse(JSON.stringify(payment));
        $scope.newPayment._id = payment._id;
        let status = $scope.newPayment.status.toString();
        $scope.newPayment.currency = $scope.newPayment.currency.toString();
        $scope.newPayment.status = payment.status ? payment.status.toString(): "0";
        $scope.newPayment.invoice = payment.invoice.length>0 ? payment.invoice[0]._id : '0';
        $scope.newPayment.doc = payment.doc.length >0 ? payment.doc[0]._id : '0';
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

    $scope.addPaymentInvoice = function(payment){

    };

    $scope.showCover = function(type){
        if($scope.addPayment){
            $scope.newPayment = JSON.parse(JSON.stringify($scope.addPayment));
            $scope.addPayment = null;
        }
        $scope.showCoverContents(type);
    }

    /*                EDIT and Delete Payment

    * */

    $scope.$on('editPayment',function(event,data){
        let updateQuery = {};
        updateQuery._id = $scope.newPayment._id;
        updateQuery.PO = $scope.newPayment.PO;
        updateQuery.account = $scope.newPayment.account? $scope.newPayment.account._id: null;
        updateQuery.amount = $scope.newPayment.amount;
        updateQuery.comment = $scope.newPayment.comment;
        updateQuery.status = Number($scope.newPayment.status);
        updateQuery.currency = Number($scope.newPayment.currency);
        updateQuery.populate = 'account';
        delete updateQuery.invoice;
        delete updateQuery.doc;
        dataManager.updateData('payment','payment added', updateQuery);
    });

    $scope.$on('editPaymentCancelDoc',function(event,data){
        $scope.resetPayment();
        delete $scope.newPayment._id;
        cancelDoc();
    })

    $scope.$on('deletePayment',function(event,data){
        for(let i=0; i<$scope.payments.length;++i){
        }
    });

    $scope.$on('deletePaymentCancelDoc',function(event,data){
        $scope.deletePayment = null;
        cancelDoc();
    })

    /*                ADD Payment

    * */

    $scope.$on('addPayment',function(event,data){
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
        updateQuery.doc = updateQuery.doc === '0' ? null : updateQuery.doc;
        updateQuery.populate = 'invoice account';
        delete updateQuery.invoice;
        delete updateQuery.doc;
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
            let doc = {
                project: $rootScope.project._id,
                payment: data.result._id,
                doc: $scope.newPayment.doc,
                type:1
            }
            dataManager.saveData('paymentDocs','payment doc added', doc);
            let invoice = {
                project: $rootScope.project._id,
                payment: data.result._id,
                doc: $scope.newPayment.invoice,
                type: 0
            }
            dataManager.saveData('paymentDocs','payment doc added', invoice);
            $scope.resetPayment();
            cancelDoc();
        }
    });

    $scope.$on('payment doc added',function(event,data){
        if(!data.success)
            return;
        if(!data.result)
            return;
        let attr = data.result.type? 'doc':'invoice';
        for(let i=0;i<$scope.payments.length;++i){
            if(data.result.payment === $scope.payments[i]._id)
                $scope.payments[i][attr].push(data.result);
        }
    });

    $scope.$on('paymentCancelDoc',function(event,data){
        cancelDoc();
    });

    $scope.showCoverContents = function(type){
        $rootScope.submitType = type;
        let innerHTML = '<table class="pageCoverTable">'+
            '<tr><td>amount:</td><td><input type="number" ng-model="newPayment.amount" style="width:6rem;margin-right:0.5rem;">' +
            '<select  ng-model="newPayment.currency" ng-options="currency.value as currency.icon for currency in currencies"></select>'+
            '<tr><td>PO:</td><td><input style="width:12rem" ng-model="newPayment.PO"></td></tr>'+
            '<tr><td>status:</td><td><select ng-model="newPayment.status">' +
            '<option value="0">PO Received</option>' +
            '<option value="1">invoice issued</option>' +
            '<option value="2">Paid</option>' +
            '<option value="3">Partly Paid</option>' +
            '</select></td></tr>' +
            '<tr ng-show="newPayment.status !== \'0\'"><td>Invoice</td><td>' +
            '<select ng-model="newPayment.invoice" ng-options="invoice._id as invoice.name for invoice in invoiceList"></select>' +
            '<a ng-show="invoiceList.length === 1" href="/doc" target="_blank" class="simpleBtn" style="text-decoration:none;margin-left:0.5rem;font-size:0.8rem;">GO TO ASSET</a>'+
            '</td></tr>'+
            '<tr><td>docs</td><td>' +
            '<select ng-model="newPayment.doc" ng-options="doc._id as doc.name for doc in docs"></select>' +
            '<a ng-show="docs.length === 1" href="/doc" target="_blank" class="simpleBtn" style="text-decoration:none;margin-left:0.5rem;font-size:0.8rem;">GO TO ASSET</a>'+
            '</td></tr>'+
            '<tr><td>Description</td><td></td></tr>'+
            '<tr><td colspan="2"><textarea style="margin-left:2rem;width:16rem;" ng-model="newPayment.comment"></textarea></td></tr>'
        '</table>';
        let element = document.getElementById('coverDetail');
        if(element){
            element = angular.element(element);
            let node = $compile(innerHTML)($scope);
            element.html('');
            element.append(node);
        }
        showPageCover(19.5);
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
                {_id:"0",name:"add invoice"}
            ];
            $scope.docs = [
                {_id:"0",name:"add Royalty/Detail"}
            ];
            for(let i=0;i<data.result.length;++i){
                if(data.result[i].type === 4)
                    $scope.invoiceList.push(data.result[i]);
                else if(data.result[i].type <=3 && data.result[i].type >=2)
                    $scope.docs.push(data.result[i]);
            }
            if($scope.invoiceList.length === 1)
                $scope.invoiceList = [
                    {_id:"0",name:"no invoice found"}
                ];
            if($scope.docs.length === 1)
                $scope.docs = [
                    {_id:"0",name:"no documents found"}
                ];
            $scope.docs = $scope.docs.concat(data.result);
        }
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
                    as: "doc"}}];
        $scope.resetPayment();
        dataManager.requestAggregateData('payment','payments requested', data);
        dataManager.requestData('docs','docs requested', {project:$rootScope.project._id, type: {$in:[2,3,4]}});
    }

    $scope.initialize();
});