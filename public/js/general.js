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
            elements[0].style.height = typeof size === 'number'? size+'rem' : size;
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
    let statusList = [`'opportunities', 'business','development','delivery','maintenance','closed','re-open','mass production'`];
    return statusList[status];
};

var countryCodes = [
    {code:"54", country:"Argentina"},
    {code:"86", country:"China"},
    {code:"852", country:"Hongkong,China"},
    {code:"886", country:"Taiwan,China"},
    {code:"39", country:"Italy"},
    {code:"81", country:"Japan"},
    {code:"55", country:"Brazil"},
    {code:"31", country:"Netherlands"},
    {code:"1", country:"united States"},
    {code:"972", country:"Israel"}
    ];