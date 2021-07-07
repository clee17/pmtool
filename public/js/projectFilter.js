app.filter('month',function(){
    return function(month,digit) {
        if (typeof month !== 'number')
           month = Number(month);
        let list = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        let monthStr=  list[month] || 'unknown';
        if(monthStr !== 'unknown'  && typeof digit === 'number' && digit >0)
            monthStr = monthStr.substring(0,digit);
        return monthStr;
    }
})

app.filter('date',function($filter){
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
        type = type.replace(/%m/,$filter('month')(month));
        type = type.replace(/&d/,currentDate.toString());
        type = type.replace(/&h/,hour.toString());
        type = type.replace(/&i/,minutes.toString());
        type = type.replace(/&s/,seconds.toString());
        if(year >= 3000)
            return '';
        return type;
    }
});

app.filter('MP',function($filter){
    return function(entry){
        if(entry.status >= 7 || entry.MP)
            return 'MP';
        else
            return '';
    }
});

app.filter('dueBy',function($filter){
    return function(entry,type){
        if(!entry)
            return "";
        let date = entry.due;
        if(!date){
            date = entry.date;
            date = Number(new Date(date));
            date += 1000*60*60*24*30;
        }
        return $filter('date')(date,type);
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
            {icon:'$',name:'dollar',full:'$(Dollor)'},
            {icon:'¥',name:'RMB',full:'¥(RMB)'},
            {icon:'￥',name:'JPY',full:'￥(JPY)'}
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
        let statusList = ['PO', 'INVOICE', 'PAID','PART'];
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
        let statusList = ['NDA', 'SOW', 'SLA','Royalty','invoice','reference','draft','other'];
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
            return version.info;
        return version.main+'.'+version.update+'.'+version.fix;
    }
});

app.filter('bugStatus',function(){
    return function(status){
        if(typeof status !== 'number'){
            status = Number(status);
        }
        let statusList = ['open','investigate','solved','closed','pended'];
        return statusList[status];
    }
});

app.filter('linkDocument',function($rootScope){
    return function(link,source){
        if(typeof source !== 'number')
            source = Number(source);
        let assetLink =   "";

        if(source === 0)
            assetLink = '/assets/'
        else if(source <=2)
            assetLink = "";
        else
            assetLink =  $rootScope.setting.DocLocalPath || "";
        if(link.indexOf('/assets/')>= 0 &&  assetLink === '/assets/' )
            assetLink = "";
        return assetLink+link;
    }
});

app.filter('linkIcon',function(){
    return function(link){
        let fileTypes = [
            {type:'excel',link:['csv','xlsx','xls']},
            {type:'pdf',link:['pdf']},
            {type:'word',link:['doc','docx']},
            {type:'ppt',link:['ppt']},
            {type:'apk',link:['apk']},
            {type:'zip',link:['zip','rar']},
        ];
        let index = link.lastIndexOf('.');
        if(index >=0){
            let type = link.substring(index+1);
            for(let i=0; i<fileTypes.length;++i){
                if(fileTypes[i].link.indexOf(type) >=0){
                    return '/img/icon/'+fileTypes[i].type+'.png';
                }
            }
            return '/img/icon/unknown.png';
        }else
            return '/img/icon/unknown.png'

    }
});

app.filter('docLink',function($filter){
    return function(doc, type){
        if(typeof doc !== 'object'){
            doc = JSON.parse(doc);
        }
        if(!type)
            return doc.link;
        else{
            if(type === '1')
                doc.source = null;
            return $filter('linkDocument')(doc.link,doc.source);
        }
    }
})

app.filter('positionLink',function($filter){
    return function(position){
        if(typeof position !== 'object'){
            position = JSON.parse(position);
        }
        if(!position)
            return ""
        else
            return $filter('linkDocument')(position.link,position.source);
    }
})

app.filter('positionAndLink',function($filter){
    return(function(release){
        if(release.link && release.link.length >1){
            return 'assets/'+release.link;
        }else{
            return $filter('positionLink')(release.position);
        }
    })
})

app.filter('positionIcon',function($filter){
    return function(position){
        if(typeof position !== 'object'){
            position = JSON.parse(position);
        }
        if(!position)
            return "/img/icon/error.png";
        else
            return $filter('linkIcon')(position.link);
    }
})

app.filter('positionAndLinkIcon',function($filter){
    return(function(release){
        if(release.link && release.link.length >1){
            return $filter('linkIcon')(release.link);
        }else {
            return $filter('positionIcon')(release.position);
        }
    })
})


app.filter('docIcon',function($filter){
    return function(doc){
        if(typeof doc !== 'object'){
            doc = JSON.parse(doc);
        }

        let link = doc.link || "";
        return $filter('linkIcon')(link);
    }
})

app.filter('trim',function($rootScope){
    return function(contents){
        while(contents[0] === " "|| contents[0] === ' '){
            contents = contents.substring(1);
        }
        return contents;
    }
})

app.filter('countryCode',function($rootScope){
    return function(code){
        if(typeof code !== 'string')
            code =code.toString();
        for(let i=0;i <countryCodes.length;++i){
            if(countryCodes[i].code === code)
                return countryCodes[i].country;
        }
        return "unknown";
    }
})

app.filter('shortenContents',function(){
    return function(contents){
        if(contents.length <=25)
            return contents;
        else
            return contents.substring(0,25) +'...';
    }
})




app.directive('uploadAccount',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{
            account:'@'
        },
        link:function(scope,element,attr){
            let account = scope.account;
            if(account === "")
                element.html('<b>No Account</b>')
            else {
                account = JSON.parse(account);
                let innerHTML = '<table><tr><td><b>user:</b></td><td><span>-username-</span></td><td style="padding-left:1rem;"><button onclick="copyPrev(this)" class="simpleBtn" style="font-size:0.85rem;font-weight:bold;">COPY</button></td></tr>' +
                    '<tr><td><b>pwd:</b></td><td><span>-password-</span></td><td style="padding-left:1rem;"><button onclick="copyPrev(this)" class="simpleBtn" style="font-size:0.85rem;font-weight:bold;">COPY</button></td></tr></table>';
                innerHTML = innerHTML.replace(/-username-/,account.username);
                innerHTML = innerHTML.replace(/-password-/,account.password);
                element.html(innerHTML);
            }
        }}
});

app.directive('addressFormat',function($compile,$rootScope){
    return{
        restrict:"A",
        scope:{
            account:'@'
        },
        link:function(scope,element,attr){
            let account = scope.account;
            if(account === "")
                element.html('<b>No Address Info</b>')
            else {
                account = JSON.parse(account);
                let innerHTML = account.address;
                innerHTML = innerHTML.replace(/\n/g,'<br>');
                element.html(innerHTML);
            }
        }}
});

app.directive('accountParent',function(){
    return{
        restrict:"A",
        scope:{
            account:'@'
        },
        link:function(scope,element,attr){
            if(scope.account && scope.account !== "")
                scope.account = JSON.parse(scope.account);
            if(!scope.account)
                element.html('');
            if(typeof scope.account !== "string"){
                let parentLink = "/account/info?id="+account._id;
                let accountName = account.name;
                let innerHTML = '<a href="'+parentLink+'">'+accountName+'</a>';
                element.html(innerHTML);
            }else
                element.html('');
        }}
});


app.directive('contentFormat',function(){
    return{
        restrict:"EA",
        scope:{
            contents:'@'
        },
        link:function(scope,element,attr){
            let result = scope.contents.replace(/\n/g,'<br>');
            if(result.length === 0)
                result = 'no info';
            element.html(result);
        }
    }
});

app.directive('docSource',function($compile){
    return{
        restrict:"EA",
        scope:{
            doc:'='
        },
        link:function(scope,element,attr){
            if(!scope.doc){
                element.html("No Document Info");
                return;
            }
            let innerHTML = '<a href="{{doc | docLink:\'2\' }}" target="_blank"><img src="{{doc | docIcon}}" style="width:1.2rem;"></a>';
            let innerHTMLOnline = '<a href="{{doc | docLink:\'2\' }}" target="_blank">+GO+</a>';
            element.html('');
            if(scope.doc.source === 0)
                element.append($compile(innerHTML)(scope));
            else if(scope.doc.source === 1)
                element.append($compile(innerHTMLOnline)(scope));
            else if(scope.doc.source === 2)
                element.append($compile(innerHTML)(scope));
        }
    }
});


