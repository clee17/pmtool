var saveDoc = function(result){
    searchDocDetail(true);
    if(result.source === 0){
        fileUpload(result);
    }else{
        simpleDocSave(result);
    }
};

var searchDocDetail = function(ifSearch){
    let element = document.getElementsByClassName('addDocCover');
    if(element.length>0)
        element[0].style.display = ifSearch? 'flex':'none';
}

var addDoc = function(){
    let topLayer = document.getElementById('pageCover');
    if(topLayer)
        topLayer.style.display = 'flex';
    setTimeout(function(){
        let element = document.getElementsByClassName('addDoc');
        if(element.length>0)
            element[0].style.height = '22rem';
    },10);
}

var submitDoc = function(){
    let result = {};
    let element = document.getElementById('nameInput');
    if(!element || element.value === ""){
        alert("文件名称不能为空");
        return;
    }
    else
        result.name = element.value;

    element = document.getElementById('customerSelect');
    if(element && element.value !== "0" && element.value !== "1")
        result.account = element.value;

    element = document.getElementById('projectSelect');
    if (element && element.value === '2')
        result.project = null;
    else if(element && element.value !== "0" && element.value !== "1")
        result.project = element.value;
    else{
        alert('请为该文档选择一个项目');
        return;
    }

    element = document.getElementById('descriptionInput');
    if(!element || element.value === ""){
        alert("文件描述不能为空");
        return;
    }
    else
        result.description = element.value;

    element = document.getElementById('sourceSelect');
    if(element)
        result.source = Number(element.value);

    element = document.getElementById('typeSelect');
    if(element)
        result.type = Number(element.value);

    element = document.getElementById('fileUpload');
    if(element && result.type === 0 && element && element.files.length === 0){
        alert('您必须上传一个文件');
        return;
    };

    element = document.getElementById('linkInput');
    if(element)
        result.link = element.value;

    element = document.getElementById('referenceInput');
    if(element)
        result.reference = element.value;

        result.populate = 'account project';
    saveDoc(result);
};

var simpleDocSave = function(result){
    var xmlhttp;
    if (window.XMLHttpRequest)
        xmlhttp=new XMLHttpRequest();
    else
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            let received = JSON.parse(LZString.decompressFromBase64(xmlhttp.responseText));
            if(received.success)
                successUpload(received);
            else
                failUpload(received);
        }
    }

    xmlhttp.open("POST", "/save/docs");

    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send("data="+encodeURIComponent(LZString.compressToBase64(JSON.stringify(result))));
}

var fileUpload = function(result){
    let files = [];
    let element = document.getElementById('fileUpload');
    if(element)
        files = element.files;
    if(files.length>0){
        let formData = new FormData()
        formData.append('file', files[0]);
        formData.append('origin','1');
        formData.append('data',encodeURIComponent(LZString.compressToBase64(JSON.stringify(result))));
        let xmlhttp = new XMLHttpRequest()
        xmlhttp.onreadystatechange = function(received){
            if (xmlhttp.readyState===4 && xmlhttp.status===200)
            {
                let received = JSON.parse(LZString.decompressFromBase64(xmlhttp.responseText));
                if(received.success)
                    successUpload(received);
                else
                    failUpload(received);
            }
        }
        xmlhttp.open("POST", "/upload/docs");
        xmlhttp.send(formData);
    }else{
        alert('Something is wrong, please try upload again');
    }
}

var successUpload = function(received){
    searchDocDetail(false);
    cancelAddDoc();
    resetDocForm();
    addNewRec(received.result);

}

var failUpload = function(received){
    searchDocDetail(false);
    alert(received.message);
}

var addNewRec = function(result){
    let element = document.getElementById('docListTable');
    if(Number(PAGE_ID) !== 1)
        return;
    if(element && element.children[0]){
        let tbody = element.children[0];
        let tr = document.createElement('TR');
        let innerHTML = '<td>'+1+'</td>';
        let accountName = result.account? result.account.name : "";
        innerHTML += '<td>'+accountName+'</td>';
        let projectName = result.project? result.project.name : "";
        innerHTML += '<td>'+projectName+'</td>';
        innerHTML += '<td>'+result.name+'</td>';
        innerHTML += '<td>'+result.description+'</td>';
        let date = new Date(result.date);
        innerHTML += '<td>'+date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate() +'</td>';
        let sourceList = ['assets','online','fileserver'];
        let source = sourceList[result.source]?sourceList[result.source]:"unknown";
        innerHTML += '<td>'+source+'</td>';
        let typeList = [ 'NDA','SOW','SLA','Royalty','invoice', 'reference'];
        let type = typeList[result.type]?typeList[result.type]:"unknown";
        innerHTML += '<td>'+type+'</td>';
        let prefix = result.source === 0? '/assets/':'';
        if(result.link.indexOf('/assets/')>=0)
            prefix = '';
        innerHTML += '<td><a href="'+prefix+ result.link +'" target="_blank">前往</a></td>';
        result.reference.replace(/\n/g,'<br>');
        innerHTML +=  '<td>'+result.reference +'</td>';
        tr.innerHTML = innerHTML;
        if(tbody.children.length <= 1 )
            tbody.appendChild(tr);
        else
           tbody.insertBefore(tr,tbody.children[1]);
        if(tbody.children.length >20)
            tbody.removeChild(tbody.children[tbody.children.length-1]);
        for(let i=1;i<tbody.children.length;++i){
            let child = tbody.children[i];
            child.children[0].innerHTML = i;
        }


    }
};

var resetDocForm = function(){
    let element = document.getElementById('nameInput');
    if(element)
        element.value = "";

    element = document.getElementById('customerSelect');
    if(element)
       element.value = "0";

    element = document.getElementById('projectSelect');
    if(element)
        element.value = "0";

    element = document.getElementById('descriptionInput');
    if(element)
       element.value = "";

    element = document.getElementById('sourceSelect');
    if(element)
        element.value = "0";

    element = document.getElementById('typeSelect');
        if(element)
            element.value = "0";

    element = document.getElementById('linkInput');
        if(element)
            element.value = "";

    element = document.getElementById('fileUpload');
    if(element)
        element.outerHTML=element.outerHTML;

    element = document.getElementById('referenceInput');
        if(element)
            element.value = "";
}

var cancelAddDoc = function(){
    let element = document.getElementsByClassName('addDoc');
    if(element.length>0)
        element[0].style.height = '0';
    setTimeout(function(){
        let topLayer = document.getElementById('pageCover');
        topLayer.style.display = 'none';
    },200);
}

var changeAccount = function(target){
    target.size = 0;
    if(target.value === '0' || target.value === '1')
        return;
    searchDocDetail(true);
    var xmlhttp;
    if (window.XMLHttpRequest)
        xmlhttp=new XMLHttpRequest();
    else
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            let received = JSON.parse(LZString.decompressFromBase64(xmlhttp.responseText));
            searchDocDetail(false);
            let obj = document.getElementById('projectSelect');
            if(!obj)
                return;
            if(received.success){
                obj.options.length = 0;
                if(received.result.length ===0){
                    obj.options.add(new Option("当前客户没有项目","1")); //这个兼容IE与firefox
                }else{
                    obj.options.add(new Option("请选择客户项目","1")); //这个兼容IE与firefox
                    obj.options.add(new Option("客户通用文档","2")); //这个兼容IE与firefox
                    for(let i=0; i<received.result.length;++i){
                        obj.options.add(new Option(received.result[i].name,received.result[i]._id)); //这个兼容IE与firefox
                    }
                }
            }
        }
    }
    xmlhttp.open("POST","/search/project");
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    let data = {
        account:target.value
    }
    xmlhttp.send("data="+LZString.compressToBase64(escape(JSON.stringify(data))));
}

var changeSource = function(target){
    if(target.value === '0'){
        let ele = document.getElementById('linkInput');
        if(ele)
            ele.style.display = 'none';
        ele = document.getElementById('fileUpload');
        if(ele)
            ele.style.display = 'block';
    }else{
        let ele = document.getElementById('linkInput');
        if(ele)
            ele.style.display = 'block';
        ele = document.getElementById('fileUpload');
        if(ele)
            ele.style.display = 'none';
    }
};

var setButtons = function(){
    let pc = document.getElementById('pageCount');
    if(!pc)
        return;
    let buttons = pc.children;
    for(let i=0;i<buttons.length;++i){
        if(buttons[i].innerHTML === PAGE_ID)
            buttons[i].disabled = true;
        else
            buttons[i].disabled =null;
    }
};

var loaded = function(){
    setButtons();
};

var gotoPage = function(index){
    let href = window.location.href;
    if(href.indexOf('?')>0)
        href=  href.substring(0,href.indexOf('?'));
    href+='?pid='+index;
    window.location.href = href;
};

var copyLocal = function(ref){
    if(ref.parentNode)
        ref = ref.parentNode;
    let prevSibling = ref.previousElementSibling;
    let text = prevSibling? prevSibling.innerText: '';
    let prefix =  SETTING.DocLocalPath || "";
    text = prefix+text;
    copyText(text);
}

window.addEventListener('paste',systemPasteListener);

var systemPasteListener = function(event){
    console.log(event.clipboardData.getData('text/plain'));
};