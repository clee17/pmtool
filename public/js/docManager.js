var saveDoc = function(result){
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
            if(received.success){
                resetDocForm();
                cancelAddDoc();
            }else
                alert(received.message);
        }
    }
    xmlhttp.open("POST","/save/docs");
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send("data="+encodeURIComponent(LZString.compressToBase64(JSON.stringify(result))));
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
    if(element && element.value !== "0" && element.value !== "1")
        result.project = element.value;

    element = document.getElementById('descriptionInput');
    if(!element || element.value === ""){
        alert("文件描述不能为空");
        return;
    }
    else
        result.description = element.value;

    element = document.getElementById('sourceSelect');
        result.source = Number(element.value);

    element = document.getElementById('typeSelect');
        result.type = Number(element.value);

    element = document.getElementById('linkInput');
        result.link = element.value;

    element = document.getElementById('referenceInput');
        result.reference = element.value;

    saveDoc(result);
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
    xmlhttp.send("data="+LZString.compressToBase64(JSON.stringify(data)));
}

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