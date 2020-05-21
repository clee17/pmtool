

app.filter('date',function(){
    return function(date,type){
        if(!date)
            return "";
        date = new Date(date);
        let year = date.getFullYear();
        let month = date.getMonth()+1;
        let currentDate = date.getDate();
        let hour = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        type = type.replace(/&y/,year.toString());
        type = type.replace(/&m/,month.toString());
        type = type.replace(/&d/,currentDate.toString());
        type = type.replace(/&h/,hour.toString());
        type = type.replace(/&i/,minutes.toString());
        type = type.replace(/&s/,seconds.toString());
        if(year >= 3000)
            return '';
        return type;
    }
});

app.filter('status',function(){
    return function(status){
        if(status === 0)
            return 'Opportunities';
        else if (status === 1)
            return 'Business';
        else if (status === 2)
            return 'Development';
        else if (status === 3)
            return 'Delivery';
        else if (status === 4)
            return 'Maintenance';
        else if (status === 5)
            return 'closed';
        else if (status === 6)
            return 'Re-open';
        else if(status === 7)
            return 'mass production';
    }
});

app.filter('account',function(){
    return function(account){
        if(account)
            return account.name;
        else
            return '';
    }
});


app.filter('active',function(){
    return function(status){
        if(typeof status !== 'number')
            status = Number(status);
        if(status === 5)
            return 'closed';
        else
            return 'active';
    }
})

app.filter('currency',function(){
    return function(currency,type){
        if(typeof currency != 'number')
            currency = Number(currency);
        let currencyList = [
            {icon:'$',name:'dollar'},
            {icon:'¥',name:'RMB'},
            {icon:'￥',name:'JPY'}
        ];
        if(!type)
            type = 'icon';
        return currencyList[currency][type] || '$';
    }
})

app.filter('payStatus',function(){
    return function(status){
        if(typeof status !== 'number')
            status = Number(status);
        let statusList = ['PO received', 'invoice issued', 'paid','partly paid'];
        let result = statusList[status];
        if(!result)
            return statusList[0];
        else
            return result;
    }
})

app.filter('calcPayment',function($filter){
    return function(paid){
        if(paid.length === 0)
           return 'Unpaid';
        let amount = {
            '0':0,
            '1':0,
            '2':0
        };

        for(let i=0; i<paid.length;++i){
            if(paid[i].currency === 0)
                amount['0'] += paid[i].amount;
            else if(paid[i].currency === 1)
                amount['1'] += paid[i].amount;
            else if(paid[i].currency === 2)
                amount['2'] += paid[i].amount;
        }
        let result = '';
        for(let attr in amount){
            if(amount[attr] >0){
                result += $filter('currency')(attr,'icon') + amount +'\n';
            }
        }
        return result;
    }
})

app.filter('docType',function(){
    return function(type){
        if(typeof type !== 'number')
            type = Number(type);
        let statusList = ['NDA', 'SOW', 'SLA'];
        let result = statusList[type];
        if(!result)
            return statusList[0];
        else
            return result;
    }
});

app.filter('docSource',function(){
    return function(type){
        if(typeof type !== 'number')
            type = Number(type);
        let statusList = ['assets', 'online', 'fileserver'];
        let result = statusList[type];
        if(!result)
            return statusList[0];
        else
            return result;
    }
});

app.filter('version',function(){
    return function(version){
        if(!version)
            return "";
        if(version.type)
            return 'choose version';
        return version.main+'.'+version.update+'.'+version.fix;
    }
});

app.filter('bugStatus',function(){
    return function(status){
        if(typeof status !== 'number'){
            status = Number(status);
        }
        let statusList = ['open','investigate','solved','closed'];
        return statusList[status];
    }
});