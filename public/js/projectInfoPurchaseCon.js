app.controller("purchaseCon",function($scope,$rootScope,$compile,$filter,dataManager) {
    $scope.POs = [];
    $scope.addPO = null;
    $scope.deletePO = null;

    $scope.resetPO =function(){
        $scope.newPayment = {
            index:"",
            amount:"",
            price:"0",
            comment:"",
            currency:"0"
        };
    };

    $scope.deletePaymentDoc = function(sign,id){
        let list = $scope.newPayment[sign];
        for(let i=0; i<list.length;++i){
            if(!list[i])
                continue;
            if(list[i]._id === id){
                list.splice(i,1);
                i--;
            }
        }
    };

    $scope.addPaymentDoc = function(sign){
        if(sign === 'invoice'){
            let newInvoice = $scope.newPayment.invoice;
            for(let i=0; i<$scope.invoiceList.length;++i){
                if($scope.invoiceList[i]._id === newInvoice)
                    $scope.newPayment.invoiceList.push($scope.invoiceList[i]);
            }
        }else if(sign === 'doc'){
            let newDoc = $scope.newPayment.doc;
            for(let i=0; i<$scope.docs.length;++i){
                if($scope.docs[i]._id === newDoc){
                    $scope.newPayment.docList.push($scope.docs[i]);
                }
            }
        }else if(sign === 'payment'){
            let newPayment = $scope.newPayment.payment;
            for(let i=0; i<$scope.payments.length;++i){
                if($scope.payments[i]._id === newPayment)
                    $scope.newPayment.paymentList.push($scope.payments[i]);
            }
        }
    }

    $scope.paymentDocExisted = function(sign){
        if(sign === 'invoice'){
            let newInvoice = $scope.newPayment.invoice;
            let list = $scope.newPayment.invoiceList;
            for(let i=0; i<list.length;++i){
                if(list[i]._id === newInvoice)
                    return true;
            }
            return false;
        }else if(sign === 'doc'){
            let newDoc = $scope.newPayment.doc;
            let list = $scope.newPayment.docList;
            for(let i=0; i<list.length;++i){
                if(list[i]._id === newDoc)
                    return true;
            }
            return false;
        }
    };



    $scope.$watch('newPayment',function(){
        if($rootScope.submitType === 'payment')
            $scope.addPayment = JSON.parse(JSON.stringify($scope.newPayment));

        let element = document.getElementById('coverDetail');
        if(element){
            let height = element.style.height;
            height = height.substring(0,height.indexOf('rem'));
            if(Number(height)>=20)
                element.style.height = (22+$scope.newPayment.invoiceList.length*1.5+$scope.newPayment.docList.length * 1.5+$scope.newPayment.paymentList.length*1.5)+'rem';
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
        $scope.resetPayment();
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
            $scope.resetPayment();
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

    $scope.$on('paymentCancelDoc',function(){
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
            '<select ng-model="newPayment.invoice" ng-options="invoice._id as invoice.name for invoice in invoiceList" style="max-width:10rem;"></select> ' +
            '<button ng-click="addPaymentDoc(\'invoice\')" ng-show="newPayment.invoice !== \'0\'" ng-disabled="paymentDocExisted(\'invoice\')">ADD</button></td></tr>'+
            '<tr ng-show="newPayment.status !== \'0\' && newPayment.invoiceList.length >= 1"><td colspan="2" style="padding-left:0.8rem;">' +
            '<div ng-repeat="inv in newPayment.invoiceList track by $index" style="display:flex;flex-direction:row;">' +
            '<span>{{$index + 1}}</span><span style="max-width:12rem;height:1.2rem;" class="singleLine">{{inv.name}}</span>' +
            '<a href="{{ inv | docLink:\'2\'}}" target="_blank" style="margin-left:0.8rem;">+</a>' +
            '<button style="margin-left:auto;margin-right:1.5rem;" class="closeButtonInline" ng-click="deletePaymentDoc(\'invoiceList\',inv._id)"><i class="fas fa-times-circle"></i></button></div></tr>'+
            '<tr><td>docs</td><td>' +
            '<select ng-model="newPayment.doc" ng-options="doc._id as doc.name for doc in docs" style="max-width:10rem;"></select>'+
            '<button ng-click="addPaymentDoc(\'doc\')" ng-show="newPayment.doc !== \'0\'" ng-disabled="paymentDocExisted(\'doc\')">ADD</button></td></tr>'+
            '<tr ng-show="newPayment.docList.length >= 1"><td colspan="2" style="padding-left:0.8rem;">' +
            '<div ng-repeat="doc in newPayment.docList track by $index" style="display:flex;flex-direction:row;">' +
            '<span>{{$index + 1}}</span><span style="max-width:12rem;height:1.2rem;" class="singleLine">{{doc.name}}</span>' +
            '<a href="{{ doc | docLink:\'2\'}}" target="_blank" style="margin-left:0.8rem;">+</a>' +
            '<button style="margin-left:auto;margin-right:1.5rem;" class="closeButtonInline" ng-click="deletePaymentDoc(\'docList\',doc._id)"><i class="fas fa-times-circle"></i></button></div></tr>'+
            '<tr ng-show="newPayment.status >= 2"><td>payments</td><td>' +
            '<select ng-model="newPayment.payment" ng-options="payment._id as payment.title for payment in paymentList" style="max-width:10rem;"></select>'+
            '<button ng-click="addPaymentDoc(\'payment\')" ng-show="newPayment.payment !== \'0\'" ng-disabled="paymentDocExisted(\'payment\')">ADD</button></td></tr>'+
            '<tr ng-show="newPayment.status >= 2 && newPayment.paymentList.length >= 1"><td colspan="2" style="padding-left:0.8rem;">' +
            '<div ng-repeat="payment in newPayment.paymentList track by $index" style="display:flex;flex-direction:row;">' +
            '<span>{{$index + 1}}</span><span style="max-width:12rem;height:1.2rem;" class="singleLine">{{payment.name}}</span>' +
            '<a href="{{ doc | docLink:\'2\'}}" target="_blank" style="margin-left:0.8rem;">+</a>' +
            '<button style="margin-left:auto;margin-right:1.5rem;" class="closeButtonInline" ng-click="deletePaymentDoc(\'paymentList\',payment._id)"><i class="fas fa-times-circle"></i></button></div></tr>'+
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
        showPageCover(22+$scope.newPayment.invoiceList.length*1.5+$scope.newPayment.docList.length * 1.5);
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
        $scope.resetPayment();
        dataManager.requestAggregateData('payment','payments requested', data);
        dataManager.requestData('docs','docs requested', {project:$rootScope.project._id, type: {$in:[2,3,4]}});
        dataManager.requestData('collection','collection requested',{account:$rootScope.project.account});
    }

    $scope.initialize();
});