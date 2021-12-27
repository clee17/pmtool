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

var trimDigit = function(num,digit){
    if(typeof num !== "string")
        num = num.toString();
    while(num.length < digit){
        num = '0'+num;
    }
    return num;
}

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

var tableToExcel = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template =
            '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
            'xmlns="http://www.w3.org/TR/REC-html40"><head>' +
            '<!--[if gte mso 9]><xml><x:ExcelWorkbook>' +
            '<x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}' +
            '</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
            '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>' +
            '<![endif]--></head><body><table>{table}</table></body></html>',
        base64 = function (s) {
            return window.btoa(unescape(encodeURIComponent(s)));
        },
        format = function (s, c) {
            return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; });
        }
    return function (table, sheetName, fileName,linkId) {
        var ctx = { worksheet: sheetName || 'Worksheet', table: table }
        var dlinkInfo = document.getElementById(linkId);
        dlinkInfo.href = uri + base64(format(template, ctx));
        dlinkInfo.download = fileName;
        dlinkInfo.click();
    }
})();



var stringifyData = function(rec){
    let current = new Date(rec.date);
    current = current.getFullYear() + '/' + (current.getMonth()+1) + '/' + current.getDate();
    if(rec.type === 2){
        if(rec.status === 4){
            rec.comment = '<b style="color:rgba(152,75,67,1)">'+ rec.user.name + "</b> reopened the task on <b>"+current+"</b>" ;
        }else{
            rec.comment = '<b style="color:rgba(152,75,67,1)">'+ rec.user.name + "</b> closed the task on <b>"+current+"</b>";
        }
    }else if(rec.type === 3){
        rec.description = rec.comment;
        rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> changed the desciption on <b>"+current+"</b>" ;
    }else if(rec.type === 4){
        rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> <b>hang </b>the task on <b>"+current+"</b>" ;
    }else if(rec.type === 5){
        rec.comment =  '<b style="color:rgba(152,75,67,1)">'+ rec.user.name +  "</b> <b style='color:green;'>complete </b>the task on <b>"+current+"</b>";
    }else if(rec.type === 6 || 7){// change type 6 + change estimation 7
    }

}
