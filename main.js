const util = require('util');
const Apify = require('apify');
const i2b = require('node-base64-image');
const request = require('request-promise');

const i2bp = util.promisify(i2b.encode);

class Anticaptcha {
    
    constructor(clientKey) {
        this.clientKey = clientKey;
    }
    
    async createTask(task) {
        let opt = {
            method: 'POST',
            uri: 'http://api.anti-captcha.com/createTask',
            body: {
                task,
                clientKey: this.clientKey,
            },
            json: true
        };
        const response = await request(opt);
        if(response.errorId > 0) throw response.errorDescription;
        return response.taskId;
    }
    
    async getTaskResult(taskId) {
        const opt = {
            method: 'POST',
            uri: 'http://api.anti-captcha.com/getTaskResult',
            body: {
                taskId,
                clientKey: this.clientKey,
            },
            json: true
        };
        const response = await request(opt);
        if(response.errorId > 0) throw response.errorDescription;
        return response;
    }

    async waitForTaskResult(taskId, timeout) {
        return new Promise((resolve, reject) => {
            const startedAt = new Date();
            const waitLoop = () => {
                if ((new Date() - startedAt) > timeout) {
                    reject(new Error("Timeout before condition pass"));
                }
                this.getTaskResult(taskId)
                .then((response) => {
                    if (response.errorId !== 0) {
                        reject(new Error(response.errorCode, response.errorDescription));
                    } else {
                        console.log(response);
                        if (response.status === 'ready') {
                            resolve(response);
                        } else {
                            setTimeout(waitLoop, 1000);
                        }
                    }
                })
                .catch((e) => reject(e));
            };
            waitLoop();
        });
    }
    
}

Apify.main(async () => {
    
    const input = await Apify.getValue('INPUT');
    if(!input.key){
        console.log('ERROR: missing "key" attribute in INPUT');
        return null;
    }
    if(!input.imageUrl){
        console.log('ERROR: missing "imageUrl" attribute in INPUT');
        return null;
    }
    
    console.log("Solving image with Anticaptcha: " + input.imageUrl);
    const anticaptcha = new Anticaptcha(input.key);
    const task = {
        type: "ImageToTextTask",
        body: await i2bp(input.imageUrl, {string: true}),
    }
    const taskId = await anticaptcha.createTask(task);
    const result = await anticaptcha.waitForTaskResult(taskId, 600000);
    await Apify.setValue('OUTPUT', result.solution.text);
    console.log('Result text: ', result.solution.text);
    
});
