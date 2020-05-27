var copyText = function(text)
{
    var tag = document.createElement('input');
    tag.setAttribute('id', 'cp_hgz_input');
    tag.value = text;
    document.getElementsByTagName('body')[0].appendChild(tag);
    document.getElementById('cp_hgz_input').select();
    document.execCommand('copy');
    document.getElementById('cp_hgz_input').remove();
}

var copyPrev = function(target){
    if(target.parentNode)
        target = target.parentNode;
    let prevSibling = target.previousElementSibling;
    let text = prevSibling? prevSibling.innerText: '';
    copyText(text);
}

var newLink = function(target){
    if(target.parentNode)
        target = target.parentNode;
    let prevSibling = target.previousElementSibling;
    let text = prevSibling? prevSibling.innerText: '';
    if(text != '')
        window.open(text);
    else
        return;
}

var showAlert = function(txt){

};

var switchGuidePanel = function(){
    let guide = document.getElementById('guideExpand');
    if(!guide)
        return;
    let prevElement = guide.previousElementSibling;
    if(prevElement && prevElement.style.width === '0px'){
        prevElement.style.width = "16rem";
        guide.innerHTML = " <i class=\"fas fa-caret-left fa-3x\" style=\"margin:auto;margin-right:0.7rem;\"></i>";
        guide.style.left = "16rem";
    }
    else{
        guide.innerHTML = " <i class=\"fas fa-caret-right fa-3x\" style=\"margin:auto;\"></i>";
        prevElement.style.width = "0px";
        guide.style.left = "0px";
    }
}