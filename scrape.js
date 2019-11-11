const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
var mongoose = require("mongoose");
// Connection URL
mongoose.connect('mongodb://localhost:27017/tickers');
const puppeteer = require('puppeteer');


const obj = {};

// Get the schema constructor
var Schema = mongoose.Schema;
var db = mongoose.connection;
 
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    console.log('connection successfull');

     
 (async function main(){
    const url = 'https://finance.yahoo.com/trending-tickers/';
 
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    
    try{
 
 
        async function getText(selector) {
            
          try{

                const el = await page.$(selector);
                const text = await page.evaluate(element => element.textContent, el);
                return text;
            }catch(err){
                console.log("Profile is missing");
                
            }
           
        }
 
        async function getEl(selector) {
            const el = await page.$(selector);
            return el;
        }
 
        let priceUrls = [];
        let profileUrls = [];
        await page.goto(url);
        const tr = await page.$$('table>tbody>tr');
        var TickerSchema = new Schema({
            name: {
              type: String
            },
            closed: {
              type: String
            },
            open: {
              type: String
            },
            market: {
              type: String
            },
            profile:{
                type: String
            } 
          
          });
          
          // Kreiram model iz šeme koristeći model method
          var Ticker = mongoose.model("Ticker", TickerSchema);
    
        for(let j = 0; j< tr.length;j++ )
        {
            const row = await tr[j].$('td>a[class="Fw(b)"]');
            priceUrls.push(await page.evaluate(element => element.getAttribute('href'), row));
            const [preProfile, query] = priceUrls[j].split('?');
            priceUrls[j] = `https://finance.yahoo.com${priceUrls[j]}`;
            profileUrls[j] = `https://finance.yahoo.com${preProfile}/profile?${query}`;
 
        }
 
 
 
        console.log(priceUrls);
        console.log(profileUrls);

        for (let i = 0; i < priceUrls.length; i++) {
            await page.waitForSelector('#YDC-Lead',{timeout:3000}).catch(() => console.log('Class quote doesn\'t exist!'));
            await page.goto(priceUrls[i]);
            console.log(priceUrls[i]);
  
            obj.name = await getText('#quote-header-info>div:nth-child(2)>div>div');
            console.log('Got name');
            obj.closed = await getText('#quote-summary>div>table>tbody>tr:nth-child(1)>td:nth-child(2)');
            console.log('Got prev');
 
            obj.market = await getText('#quote-summary>div:nth-child(2)>table>tbody>tr:nth-child(1)>td:nth-child(2)');
            console.log('Got market');
 
            obj.open = await getText('#quote-summary>div>table>tbody>tr:nth-child(2)>td:nth-child(2)');
            console.log('Got open');
 
            console.log(profileUrls[i]);
            await page.goto(profileUrls[i]);
 
            obj.profile = await getText('div[class="asset-profile-container"]');
            console.log('Got profile');
 
            console.log(JSON.stringify(obj));

            
        
            let ticker= new Ticker({
                name:obj.name,
                closed:obj.closed,
                open:obj.open,
                market:obj.market,
                profile:obj.profile
            })
        
              ticker.save(function (err, book) {
                if (err) return console.error(err);
                console.log(ticker + " saved to ticker collection.");
              });
        
        }
 
      
    } catch(e){
        console.log('Our error',e);
  
    }
         browser.close();
         return obj;
})()
.catch(e => console.log(e));
 
})

  

