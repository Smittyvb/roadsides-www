var http = require("http");
var fs = require("fs");

var xml = "";
xml +=
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

function addRoadside(url, archived) {
  xml += `<url>
    <loc>http://roadsideattractions.ca/roadside` + url + `</loc>
    <priority>` + (archived ? "0.4" : "0.8") + `</priority>
    <changefreq>monthly</changefreq>
  </url>
  `;
}

http.get("http://new-roadside-stuff-smittyvb.c9users.io:8081/roadsides", function(res) {
  res.setEncoding('utf8');
  var rawData = '';
  res.on('data', (chunk) => rawData += chunk);
  res.on('end', () => {
    try {
      var parsedData = JSON.parse(rawData);
      parsedData.forEach(function(roadside) {
        addRoadside(roadside.url, roadside.archive);
      });
      xml += "</urlset>";
      fs.writeFile("roadsides.xml", xml, "utf-8", function(err) {
        console.log(err);
      });
    }
    catch (e) {
      console.log(e.message);
    }
  });
});
