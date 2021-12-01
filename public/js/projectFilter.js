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
            return 'MP';
        else if (status === 5)
            return 'closed';
        else if (status === 6)
            return 'Re-open';
        else if(status === 7)
            return 'mass production';
    }
});

app.filter('taskStatus',function(){
    return function(status){
        if(status === 0)
            return 'Review';
        else if (status === 1)
            return 'Engineer';
        else if (status === 2)
            return 'QA';
        else if (status === 3)
            return 'Feedback';
        else if (status === 4)
            return 'CLOSED';
        else if (status === 5)
            return 'Pending';
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

app.filter('hourToDay',function(){
    return function(hour){
        if(!hour)
            hour =0;
        let days = hour/8;
        return days.toFixed(2);
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


app.filter('versionname',function(){
    return function(version) {
        if(version.name && version.name.length >0)
            return version.name
        else
            return version.version.main.toString()+'.'+version.version.update.toString()+'.'+version.version.fix.toString();
    }
})


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
            {type:'msg',link:['msg']},
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

app.filter('contentFormat',function(){
    return function(contents){
            let result = contents.replace(/\n/g,'<br>');
            if(result.length === 0)
                result = 'no info';
            return result;
        }
});

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


app.directive('floatBoard',function(){
    return{
        restrict:"C",
        scope:{
            index:"@"
        },
        link:function(scope,element,attr){
            scope.clicked = false;
            scope.$on('floatClicked',function(event,data){
                if(data.index === scope.index) {
                    scope.clicked = !scope.clicked;
                    if(data.status)
                        scope.clicked=  data.status;
                    let height = scope.clicked ? data.height + 'rem' : '0';
                    let opacity = scope.clicked ? '1' : '0';
                    element.css('height', height);
                    element.css('opacity', opacity);
                    scope.refresh();
                }

            });

            // click to close the panel;
            scope.$on('clicked',function(event,data){
                if(scope.clicked){
                    let target =data.target;
                    let hide = true;
                    while(target){
                        if(target === element[0])
                            hide = false;
                        target= target.parentElement;
                    }
                    if(hide){
                        element.css('height',0);
                        element.css('opacity',0);
                        scope.clicked = false;
                    }
                    scope.refresh();
                }

            });

            // Finish on the click issue
            scope.$on('force close float',function(event,data){
                if(data.index === scope.index) {
                    scope.clicked = false;
                    element.css('height', '0');
                    element.css('opacity', '0');
                    scope.refresh();
                }
            })

            // finish on
            scope.refresh = function(){
                scope.$emit('float status changed',{index:scope.index, status:scope.clicked});
            }

        }}
})



app.directive('filterCheck',function(){
    return{
        restrict:"C",
        scope:{
            index:"@",
            id:"@",
        },
        link:function(scope,element,attr){
            scope.isChecked = function(selected){
                if(typeof scope.id !== 'number')
                    scope.id = Number(scope.id);
                if(selected.indexOf(scope.id) >=0){
                    let children = element.children();
                    children[1].style.display = 'inline-block';
                    element.css('color','rgba(152,75,67,1)');
                }else{
                    element.css('color','inherit');
                    let children = element.children();
                    children[1].style.display = 'none';
                }
            };

            scope.$on('filter refreshed',function(event,data){
                if(data.index !== scope.index)
                    return;
                scope.isChecked(data.selected);
            });

            scope.$emit('refresh filter', {});
        }
    }
})



app.directive('taskType',function(){
    return{
        restrict:"EA",
        scope:{
            type:"@",
        },
        link:function(scope,element,attr){
            let type = Number(scope.type);
            if(type === 0){
                element.html('<div style="background:darkred;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">IS</div>')
            }else if(type=== 1)
                element.html('<div style="background:orangered;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">RQ</div>')
            else if(type ===2)
                element.html('<div style="background:darkgreen;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">RL</div>')
            else if(type === 3)
                element.html('<div style="background:yellow;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">QA</div>')
            else if(type ===4)
                element.html('<div style="background:dodgerblue;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">DOC</div>')
            else if(type ===5)
                element.html('<div style="background:lightgray;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">OTH</div>')
            else if(type ===6)
                element.html('<div style="background:mediumpurple;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">TA</div>')
            else if(type ===7)
                element.html('<div style="background:greenyellow;border-radius:0.5rem;font-weight:bold;color:white;padding:5px;text-align:center;display:inline-block;font-size:inherit;margin:inherit;">PAY</div>')

        }
    }
})

app.filter('taskType',function(){
    return function(type){
        if(typeof type !== 'number')
            type = Number(type);
        let typeList = ['ISSUE','Milestone','Release','QA',"DOC",'OTHER',"TASK","PAYMENT"];
        return typeList[type] || 'Unknown';
    }
})



app.directive('infoList',function(){
    return{
        restrict:"A",
        scope: {
            info:"@"
        },
        link:function(scope,element, attr){
            let info = JSON.parse(scope.info);
            let html = "";
            if(!Array.isArray(info)){
                html += ' <div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" >'+info+ '</div>';
                element.html(html);
            }else if(info.length === 0){
                element.html("no info");
            }else{
                for (let i = 0; i < info.length; ++i) {
                    let info_d = info[i];
                    html += ' <div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" >'+info_d.name + '</div>';
                }
                element.html(html);
            }
        }
    }
});

app.directive('infoLine',function(){
    return{
        restrict:"A",
        scope: {
            info:"@",
            width:"@",
        },
        link:function(scope,element, attr){
            let minWidth = scope.minWidth || '6rem';
            let maxWidth = scope.maxWidth || '8rem';
            let info = JSON.parse(scope.info);
            let html = "";
            if(!Array.isArray(info)){
                html += ' <div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:'+minWidth+';max-width:'+maxWidth+';" >'+info+ '</div>';
                element.html(html);
            }else if(info.length === 0){
                element.html("no info");
            }else{
                html = '<div style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:'+minWidth+'max-width:'+maxWidth+';" >';
                for (let i = 0; i < info.length; ++i) {
                    if(i>0)
                        html+=',';
                    let info_d = info[i];
                    html += info_d.name;
                }
                console.log(html);
                html+= '</div>';
                element.html(html);
            }
        }
    }
});