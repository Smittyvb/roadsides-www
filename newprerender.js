const puppeteer = require("puppeteer");
const commandLineArgs = require("command-line-args");
const requestSync = require("sync-request");
const fs = require("fs-extra");

const execSync = require("child_process").execSync;

const ROADSIDE_LIST = "http://localhost:8443/roadsides";

var renderList = [];

JSON.parse(requestSync("GET", ROADSIDE_LIST).body.toString())
  .forEach(function(roadside) {
    renderList.push(roadside.url.substr(1, roadside.url.length));
  });

console.log("got roadside list");

var sPages = [
  "main",
  //static pages
  "contact",
  "founder",
  "pics",
  "province",
  "map",
  //"merch",
  //all roadsides page
  "alphabet",
  //province pages
  "alberta",
  "bc",
  "manitoba",
  "newbrunswick",
  "nfld",
  "nwt",
  "novascotia",
  "nunavut",
  "ontario",
  "pei",
  "quebec",
  "sask",
  "yukon",
  //other
  "archive",
  "whatsnew",
  "tch",
  "type",
  "tags",
  "terms",
  "media",
  "extras",
  "submit",
  "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m"];
renderList = renderList.concat(sPages);

const optionDefinitions = [{
  name: 'file',
  type: String,
  defaultOption: true
}];
const options = commandLineArgs(optionDefinitions);

let pup = null;
let pPage = null;
async function getPup() {
  if (pPage) return pPage;
  //console.log("launching pup");
  if (!pup) pup = await puppeteer.launch({ product: "chrome" });
  pPage = await pup.newPage();
  //pPage.setDefaultNavigationTimeout(0);
  return pPage;
}

function render(roadsideUrl, cb) {
  if (roadsideUrl === "whatsnew") { pup.close(); pup = null; pPage = null; }; // hack
 getPup().then(async page => {
    console.log("got pup");
    try {
    //const page = await browser.newPage();
    const pageUri = 'http://localhost:' + (process.env.ROADPORT || '80') + (process.env.NO_SPA_SUB ? '' : '/spa') + '/#/' + roadsideUrl;
    await page.evaluate("document.title = 'Roadside Attractions'");
    await page.goto(pageUri);
    await page.evaluate("window.PRERENDER = true;")
    await page.waitFor(".loaded", {timeout: 60000 * 3});
    await page.evaluate("document.querySelectorAll('.loaded').forEach(ele => ele.parentElement.removeChild(ele))");
    await page.evaluate(`if (document.querySelectorAll("[property='og:url']").length < 1) {
      document.getElementsByTagName("head")[0].innerHTML += document.getElementById("media").innerHTML = "\n<!-- Social Tags -->\n<meta name=\"twitter:title\" content=\"" + roadsideData.name + "\">\n<meta name=\"twitter:image:alt\" content=\"" + roadsideData.name + "\">\n<meta property=\"og:title\" content=\"" + roadsideData.name + "\">\n<meta name=\"twitter:url\" content=\"" + "https://roadsideattractions.ca" + roadsideData.url + "\">\n<meta property=\"og:url\" content=\"" + "http://roadsideattractions.ca" + roadsideData.url + "\">\n<meta name=\"twitter:image:src\" content=\"" + "https://roadsideattractions.ca" + roadsideData.url + ".jpg" + "\">\n<meta property=\"og:image\" content=\"" + ("https://roadsideattractions.ca" + roadsideData.url + ".jpg") + "\">\n<meta name=\"twitter:description\" content=\"Large Canadian Roadside Attractions\">\n<meta name=\"twitter:card\" content=\"summary_large_image\">\n<meta name=\"twitter:site\" content=\"@Roadside_Canada\">\n<meta name=\"twitter:creator\" content=\"@Roadside_Canada\">\n<meta name=\"twitter:domain\" content=\"roadsideattractions.ca\">\n<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:site_name\" content=\"Large Canadian Roadside Attractions\">\n<meta property=\"og:locale\" content=\"en_US\">\n";
    }`);
    var html = await page.evaluate("document.documentElement.outerHTML");
    await
    html = html.split("<!--NO-PRERENDER-->");
    html = html[0] +
      "<script src='hashtourl.js'></script>" +
      html[1].split("<!--END-->")[1];
    var canShowAd = false;//sPages.indexOf(roadsideUrl) === -1;
    var randomCanShowAd = Math.random();
    console.log(roadsideUrl, canShowAd, randomCanShowAd.toFixed(2));
    if (canShowAd && (randomCanShowAd > 0.5)) {
      html = html.replace("<!--AD-->", 
//`<a href="/roadside/merch"><img src="https://ipfs.eternum.io/ipfs/QmZBAspszTBUhX7LpYPY4mvYM5sKHkbrJVZ6iEdqvknA83/lcra-ad1.jpg"></a>`
`<a href="/roadside/merch"><div style="padding-top: 13em;">Ad</div><img src="https://ipfs.eternum.io/ipfs/QmZBAspszTBUhX7LpYPY4mvYM5sKHkbrJVZ6iEdqvknA83/lcra-ad1.jpg"></a>`
                   );
    }
    output = "<!doctype html><html>" + html + "</html>";
    fs.writeFile(__dirname + '/roadside/' + ((roadsideUrl === "main") ? "index" : roadsideUrl) + ".html", html, (err) => {
      if (err) throw err;
    });
    } catch (e) {
        console.log("render error", e);
        pup = null; pPage = null;
        pup.close();
        setTimeout(() => render(roadsideUrl, cb), 7500);
        return;
    }
    cb();
  });
}
if (options.file) {
  render(options.file, function () {
    console.log("Rendered " + options.file);
  });
} else {
  function renderAll(toRender, cb) {
    if (toRender.length === 0) {
      return cb();
      //setTimeout(renderLoop, 30000);
    }
    let name = toRender.shift();
    render(name, function () {
      process.stdout.write('\x1B[2J\x1B[0f');
      console.log( ( (1 - (toRender.length / renderList.length)) * 100).toFixed(1) + "% done!" + name);
      renderAll(toRender, cb);
    });
  }

  //Main loop. This keeps running, rendering everything.
  function renderLoop() {
    //execSync("cd roadside-to-json;sh convert.sh;cd ..");
    renderAll(JSON.parse(JSON.stringify(renderList)), () => { console.log("Done!"); process.exit(0); });
  }
  renderLoop();
}
