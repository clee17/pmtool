var requesting = false;

var closeLeftMap = function(){
    let element = document.getElementById('leftMap');
    if(element)
        element.style.display= 'none';
    var floater = document.getElementById('mapFloater');
    if(floater)
        floater.style.display = 'block';
}

var showLeftMap = function(){
    let element = document.getElementById('leftMap');
    if(element)
        element.style.display= 'flex';
    var floater = document.getElementById('mapFloater');
    if(floater)
        floater.style.display = 'none';
}

var refreshPage = function(ele,type){
    requesting = true;
    let newPage = ele.innerHTML;
    newPage = newPage.toLowerCase();
    newPage = newPage.replace(/\s/g,'');
    let div = document.createElement('div');
    div.style.transition = 'opacity 0.24s ease-out';
    div.style.background = 'white';
    div.style.opacity = '0';
    div.style.position = 'absolute';
    div.style.left = '2rem';
    div.style.top = '0';
    div.id = 'contentsCover';
    let contents = document.getElementById('contents');
    if(contents){
        contents.appendChild(div);
        setTimeout(function(){
            div.style.opacity = '0.5';
            div.style.width = '100%';
            div.style.height = 'calc(100% - 5rem)';
        }, 10);
    }
    let newUrl = '/manual/'+newPage;
    let request = new XMLHttpRequest();
    request.open("GET", newUrl);
    request.send();
    request.onload = function () {
        if(request.readyState==4 && request.status==200){
            let HTML = request.responseText;
            let startStr = '<div id="contents">';
            let startIndex = HTML.indexOf(startStr)+startStr.length;
            let endStr = '<div id="endSign" style="display:none">';
            let endIndex = HTML.indexOf(endStr);
            HTML = HTML.substring(0,endIndex);
            endIndex=  HTML.lastIndexOf('</div>');
            startIndex = HTML.indexOf(startStr)+startStr.length;
            let newHTML = HTML.substring(startIndex,endIndex);
            let contents = document.getElementById('contents');
            let cover = document.getElementById('contentsCover');
            if(contents && cover){
                contents.removeChild(cover);
                contents.innerHTML = newHTML;
                contents.appendChild(cover);
            }
            if(cover){
                cover.opacity = '0';
                setTimeout(function(){
                    cover.parentElement.removeChild(cover);
                },240);
                requesting = false;
            }
            if(window.history)
                window.history.pushState({},'','/manual/'+newPage);

        }
    };
}

var refreshAllLinks = function(hideNext){
    let topLinks = document.getElementsByClassName('topLink');
    for(let i=0; i<topLinks.length;++i){
        let link = topLinks[i];
        link.style.fontWeight = 'normal';
        if(!hideNext)
            continue;
        let nextEle = link.nextElementSibling;
        if(nextEle)
            nextEle.style.display = 'none';
    }
}

var refreshAllLis = function(){
    let liBtns = document.getElementsByTagName('li');
    for(let i=0;i<liBtns.length;++i){
        let li = liBtns[i];
        li.style.color = "inherit";
        li.style.fontWeight = 'normal';
        li.style.background = 'white';
        let subElements = li.children;
        if(subElements.length >0)
            subElements[0].style.display = 'none';
    }
}

var finishLoad = function(){
    let currentPageId = window.location.href;
    currentPageId = currentPageId.substring(currentPageId.indexOf('/manual/')+8);
    let topLinks = document.getElementsByClassName('topLink');
    for(let i=0; i<topLinks.length;++i){
        let link = topLinks[i];
        let linkName =    link.innerHTML;
        linkName = linkName.toLowerCase();
        linkName = linkName.replace(/\s/g,'');
        if(linkName === currentPageId){
            link.style.fontWeight = 'bold';
            let nextEle = link.nextElementSibling;
            if(nextEle)
                nextEle.style.display = 'block';
        }

        link.onclick = function() {
            if(requesting)
                return;
            let selected = link.style.fontWeight === 'bold';
            if(!selected){
                refreshAllLinks(true);
                refreshAllLis();
                link.style.fontWeight = 'bold';
                let nextEle = link.nextElementSibling;
                if(nextEle)
                    nextEle.style.display = 'block';
            }
            refreshPage(link,'link');
        };
    }

    let liBtns = document.getElementsByTagName('li');
    for(let i=0;i<liBtns.length;++i){
        let li = liBtns[i];
        let leftMap = li.parentElement;
        while(leftMap){
            if(leftMap.getAttribute('id') === 'leftMap')
                break;
            leftMap = leftMap.parentElement;
        }
        if(!leftMap)
            continue;
        let liName  =    li.innerHTML;
        liName = liName.toLowerCase();
        liName = liName.replace(/\s/g,'');
        if(liName === currentPageId){
            li.style.color = "#2a75c0";
            li.style.fontWeight = 'bold';
            li.style.background = 'rgba(185,185,185,0.6)';
            let showEle = li.parentElement;
            while(showEle){
                if(showEle.tagName.toLowerCase() === 'ul')
                    showEle.style.display = 'block';
                showEle  = showEle.parentElement;
            }
        }
        li.onclick = function(){
            if(requesting)
                return;
            let selected = li.style.color === '#2a75c0';
            if(!selected){
                refreshAllLinks(false);
                refreshAllLis();
                li.style.color = "#2a75c0";
                li.style.fontWeight = 'bold';
                li.style.background = 'rgba(185,185,185,0.6)';
                let subElements = li.children;
                if(subElements.length >0)
                    subElements[0].style.display = 'block';
                refreshPage(li,'li');
            }
        }
    }
};

var scrollToView = function(tagName){
    let ele = document.getElementById(tagName);
    if(ele){
        ele.scrollIntoView();
    }

}