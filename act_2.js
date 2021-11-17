//node act_2.js --url='https://www.hackerrank.com' --config='config.json'

// npm init -y
// npm install minimist
// npm install puppeteer 

let minimist = require('minimist');
let fs = require('fs');
let pup = require('puppeteer');
const { url } = require('inspector');

let args = minimist(process.argv);

let configJSON = fs.readFileSync(args.config,'utf-8');
let config = JSON.parse(configJSON);
console.log(config);

async function run(){
    let browser = await pup.launch({
        headless : false,
        args : [
            '--start-maximised'
        ],
        defaultViewport : null
    });
    let page = await browser.newPage();

    //Open Hackerrank
    await page.goto(args.url);

    //Click on 1st link
    await page.waitForSelector("a[href='https://www.hackerrank.com/access-account/']");
    await page.click("a[href='https://www.hackerrank.com/access-account/']");

    //Click on 2nd link
    await page.waitForSelector('a[href="https://www.hackerrank.com/login"]');
    await page.click('a[href="https://www.hackerrank.com/login"]');

    //Enter username
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', config.userid, {delay : 30});

    //Enter password
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', config.password, {delay : 30});

    await page.waitFor(2000);
    
    //Click on the login button
    await page.waitForSelector('button[data-analytics="LoginPassword"]');
    await page.click('button[data-analytics="LoginPassword"]');

    //Select the 'Contest' from the navigation bar
    await page.waitForSelector('a[data-analytics="NavBarContests"]');
    await page.click('a[data-analytics="NavBarContests"]');

    //Click on manage Contest 
    await page.waitForSelector('a[href="/administration/contests/"]');
    await page.click('a[href="/administration/contests/"]');

    //Find total number of pages to process
    await page.waitForSelector('a[data-attr1="Last"]');
    let numPages = await page.$eval('a[data-attr1="Last"]', function(atag){
        let np = parseInt(atag.getAttribute('data-page'));
        return np;

    });

    console.log(numPages);

    //Navigating through pages one by one
    for(let i=1; i<=numPages; i++){

        //It is used to find all the urls in the same page
        await page.waitForSelector("a.backbone.block-center");
        let curls =  await page.$$eval(" a.backbone.block-center",function(atag){
        
        let urls = [];

        for(let i=0; i<atag.length; i++){
            let url = atag[i].getAttribute("href");
            //console.log(url);
            urls.push(url);
        }
        return urls;
    
    });
    console.log(curls);

    //Using this loop we open each contest in a new page 
    for(let j=0; j<curls.length; j++){
        let curl = curls[j];
        let ctab = await browser.newPage();

        //Calling the saveModerator function
        await saveModerator(args.url + curl, ctab, config.moderator)
        
        //Closing the tab
        await ctab.waitFor(2000);
        await ctab.close();
        await ctab.waitFor(2000);

    }

        //This condition makes sure that we don't click the next page button when we reach the last page
        await page.waitFor(3000);
        if(i!=numPages){
            await page.waitForSelector('a[data-attr1="Right"]');
            await page.click('a[data-attr1="Right"]');
            await page.waitFor(1000);
        }
    }

    await browser.close();

}

async function saveModerator(url,ctab, moderator){

    await ctab.bringToFront();
    await ctab.goto(url);
    await ctab.waitFor(2000);

    //Select the option 'Moderator' and click on it
    await ctab.waitForSelector('li[data-tab="moderators"] > a');
    await ctab.click('li[data-tab="moderators"] > a');

    //Type in moderator
    await ctab.waitForSelector('input#moderator');
    await ctab.type('input#moderator', moderator, {delay : 30});

    //Press Enter
    await ctab.keyboard.press('Enter');
}

run();