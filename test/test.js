/**
 * Selenium test bot script use to stress test heroku server
 */



const Inputs = ['a', 's', 'd', 'o', 'p'];
function sleep (time) {
    return new Promise(r => setTimeout(r, time));
}

function randInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomBehaviour(action) {
    const index = randInt(0, 4)
    console.log('performed input: ', Inputs[index]);
    return action.keyDown(Inputs[index]).pause(randInt(100, 1000)).keyUp(Inputs[index]).perform();
}

async function randomBot(name) {
    var { Builder, By, until } = require('selenium-webdriver');
    const chrome = require('selenium-webdriver/chrome');
    var driver = new Builder().forBrowser("chrome").build();//.setChromeOptions(new chrome.Options().addArguments('--headless')).build();
    var actionnumber = 0;
    try {
        driver.get("https://game-dungeonio-test.herokuapp.com/");
    } catch(e) {
        console.log('error connecting ', e);
    }
    try {
        let inputElement = await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div[2]/div[2]/div[1]/div/input')), 20000)
        let playButton = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div[2]/div[2]/div/button'));
        await inputElement.sendKeys('testbot');
        await playButton.click()
        await sleep(6000)
        let canvas = await driver.findElement(By.xpath('/html/body/canvas'));
        await canvas.click();
        console.log('connected to game');
        let action = driver.actions();
        while (true) {
            console.log('action : ', actionnumber, 'name: ', name);
            await randomBehaviour(action);
            const restartbutton = await driver.findElements(By.xpath('/html/body/div[3]/div/div[2]/div/div/div'));
            if (restartbutton.length > 0) {
                console.log(name, ' died');
                restartbutton[0].click();
                let inputElement = await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div[2]/div[2]/div[1]/div/input')), 20000)
                let playButton = await driver.findElement(By.xpath('/html/body/div[3]/div[2]/div[2]/div[2]/div/button'));
                await inputElement.sendKeys('testbot');
                await playButton.click()
                await sleep(6000)
                let canvas = await driver.findElement(By.xpath('/html/body/canvas'));
                await canvas.click();
                console.log(name, ' reconnected to game');
            };
            actionnumber++;
        }
        console.log('end test');
        await sleep(1000);
    } catch (e) {
        console.log('what happened: ', e);
    }
    (await driver).quit();
    console.log('quit');
}

(function main() {
    const numbots = 2;
    for (let i = 0; i < numbots; i++) {
        randomBot(`bot ${i}`);
    }
})();


