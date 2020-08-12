var fs = require('fs'),
    path = require('path');

var templateDir = path.join(path.resolve(__dirname),'../../template');
var viewDir = path.join(path.resolve(__dirname),'../../view');

var leftMapTemplate = fs.readFileSync(path.join(templateDir,'/leftMap.html'),'utf8');


fs.readdir(viewDir, (err, files) => {
    if (err) throw err;
    for(let i=0; i<files.length;++i){
        console.log('start replacing of '+files[i]);
        let fileContents = fs.readFileSync(path.join(viewDir,files[i]),'utf8');
        let endStr = '<div id="mapFloater" onclick="showLeftMap()">MAP</div>';
        let startStr = '<div id="leftMap">';
        let endIndex = fileContents.indexOf(endStr)+endStr.length;
        let startIndex = fileContents.indexOf(startStr);
        let newFileContents = fileContents.substring(0,startIndex)+leftMapTemplate+fileContents.substring(endIndex);
        fs.writeFile(path.join(viewDir,files[i]),newFileContents,(err)=>{
            if(err)
                console.log(files[i]+err);
            else
                console.log(files[i]+' leftMap replace success');
        })
    }
});
