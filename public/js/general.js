var cancelDoc = function(){
    let elements = document.getElementsByClassName('addDoc');
    if(elements.length>0)
        elements[0].style.height = '0';
    let topLayer = document.getElementById('pageCover');
    topLayer.style.display = 'none';
    setTimeout(function(){
        let topLayer = document.getElementById('pageCover');
        topLayer.style.display = 'none';
    },200);
}

var showPageCover = function(size,width){
    let topLayer = document.getElementById('pageCover');
    if(topLayer)
        topLayer.style.display = 'flex';
    setTimeout(function() {
        let elements = document.getElementsByClassName('addDoc');
        if (elements.length > 0){
            elements[0].style.height = size+'rem';
            if(width)
                elements[0].style.width = width+'rem';
            else
                elements[0].style.width = '24rem';
        }

    },10);
}

var getCurrentStatus = function(status){
    if(typeof status !== 'number')
        status = Number(status);
    let statusList = ['opportunities', 'business','development','delivery','maintenance','closed','re-open','mass production'];
    return statusList[status];
};