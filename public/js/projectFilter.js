

app.filter('date',function(){
    return function(date,type){
        if(!date)
            return "";
        date = new Date(date);
        let year = date.getFullYear();
        let month = date.getMonth()+1;
        let currentDate = date.getDate();
        type = type.replace(/&y/,year.toString());
        type = type.replace(/&m/,month.toString());
        type = type.replace(/&d/,currentDate.toString());
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
            return 'Evaluation';
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
    }
});
