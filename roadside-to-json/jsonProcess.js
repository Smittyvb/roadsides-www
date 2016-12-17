var PRODUCTION = true;

var fs = require("fs");

var initJson = fs.readFileSync("csvtojson.json");
initJson = JSON.parse(initJson);
var outJson = [];

function cap(name) {
  var outName = "";
  name.split(" ").forEach(function(word) {
    outName += word.substr(0, 1).toUpperCase() + word.substr(1, word.length) + " ";
  });
  return outName.substr(0, outName.length -1);
}

initJson.forEach(function(roadside) {
  if (((roadside.productionReady !== "yes") && PRODUCTION) || roadside.url === undefined){
    return;
  }
  
  roadside.url = roadside.url.replace("http://roadsideattractions.ca", "").replace(".html", "");
  roadside.name = cap(roadside.name);
  roadside.city = cap(roadside.city);
  roadside.province = cap(roadside.province);
  
  outJson.push(roadside);
});

var output = JSON.stringify(outJson, null, 2);

output = '{"roadsides": \n\n' + output + "}"

fs.writeFileSync("io/processed.json", output);
fs.unlinkSync("csvtojson.json");