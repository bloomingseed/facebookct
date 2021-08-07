// validates a URL generated from the GAS or a facebook comment URL
function isFacebookUrlMatchFormat(url,output){
    if(typeof(url)!='string') 
        return false;
    let pattern = /https:\/\/(www.)?facebook.com\/groups\/.+\/posts\/\d+\/(.+)$/;    // validates post and comment url with any parameters
    let matches = url.match(pattern);
    if(!matches || matches.length!=3) 
        return false;     // ensures url is a facebook post and has query string
    let urlParams = matches[2];
    let q = new URLSearchParams(urlParams);
    let paramKeys = [   // possible params
                        'comment','row', 'timeout',    // params to make comment
                        'comment_id','facebookct'];      // param to delete comment 
    let o = {}
    for(let key of paramKeys){
        if(q.get(key)!=null) 
            o[key] = q.get(key);
    }
    output['params'] = o;
    output['type'] = o['comment_id'] && o['facebookct']?'delete'
                    :o['comment'] && o['row'] && o['timeout']?'comment'
                    :null;
    return true;
}
/**
 * Maintain working tabs to identify their message
 */
function getTabListInstance(){
    if(globalThis.tabList==undefined){
        globalThis.tabList = {};
    }
    return globalThis.tabList;
}
function sendMessageContentScript(tabId, message){
    chrome.tabs.sendMessage(tabId, message);
}
/**
 * Called when a tab gets updated (refreshed, navigated, or internal updates?)
 */
function onTabUpdatedListener(tabId,changeInfo,tab){
    const TAG = 'onTabUpdatedListener';
    console.log(TAG,`TabId ${tabId}, Url ${tab.url}: updated.`);
    let output = {};
    let url = tab.url;
    let tabList = getTabListInstance();
    if((!isFacebookUrlMatchFormat(url,output) || output['type']==null) && tabList[tabId]==undefined)   // checks if the tab either has invalid url or not tracked
        return;
    console.log(TAG,`TabId ${tabId}, Url ${tab.url}: Parameters:`,output);
    if(tabList[tabId]==undefined){  // checks if this tabId is not tracked
        tabList[tabId]=output;    // tracks tab id with parameters
        let delim = '?';    // delimiter for type of "comment"
        if(output.type==='delete'){
            delim = '&';    // delimiter for type of "delete"
        }
        let navUrl = url.substring(0,url.indexOf(delim));   // gets original url
        console.log(TAG,`Navigating ${tabId} from ${url} to ${navUrl}..`)
        chrome.tabs.update(tabId,{url:navUrl}); // navigates the tab to the same url without query string
        return;
    }
    chrome.scripting.executeScript({    // inject content.js script
        target:{tabId},
        files: ['content.js']
    });
    console.log(TAG,`TabId ${tabId}, Url ${tab.url}: script injected.`);
}
/**
 * Ensures the request contains required keys to generate the payload as in `generatePayload` function
 */
function isMessageMatchFormat(request){
    let arr = ['row','val','type'];    // defines required keys
    for(let key of arr){
        if(request[key]==undefined)     // checks if the request doesn't contain this required key
            return false;
    }
    return true;
}
/**
 * Encapsulating `args` for calling GAS API.
 * Different types of request resulting in different payload!
 */
function generatePayload(args,type){
    let funcName, params;
    if(type=='comment' && args.timeout){
        funcName = 'scheduleDeleteComment';
        params = [args.val, args.timeout, args.row];
    } else {
        funcName = 'setStatusValue';
        params = [args.row, args.val];
    }
    // const FUNC_NAME = 'setStatusValue'; // defines GAS method name to call
    // return JSON.stringify({
    //     "function": FUNC_NAME,
    //     "parameters": [args.row, args.val]  // defines the arguments for the GAS method
    // });
    return JSON.stringify({
        'function':funcName,
        'parameters':params
    });
}
function getTokenStorage(callback){
    const KEY = 'token';    // the key used to save the token
    chrome.storage.local.get(KEY,function(data){
        callback(data[KEY]);
    });
}
function getTokenRemoteAndCache(callback){
    chrome.identity.getAuthToken({interactive:true}, function(token){
        const KEY = 'token';
        const data = {};
        data[KEY] = token;
        chrome.storage.local.set(data, function(){callback(token)});
    });
}
/**
 * args: object with commentUrl, row, col properties
 */
function xhrWithAuth(payload) {
    const TAG = 'xhrWithAuth';
    var retry = true;
    // const API_KEY = 'AIzaSyBoOa9ile3fk8_dEo4DRMEzD2g4uRdvLI8';
    // const SCRIPT_ID = 'AKfycbxdp2tFOBq2XcKm_oZdj-oUbnn_SozhRwJeDE6mkgmjFtjevJ49iqoEVFVsmGhS7Pi4';
    const DEPLOYMENT_ID = 'AKfycbxRRKwwRKNL4NWdm4XzO3hpVJ7OdCkJi-cNqBKxdfxzyvSKm-eHACPJF7YpJd3KzV5J';
    const POST_URL = `https://script.googleapis.com/v1/scripts/${DEPLOYMENT_ID}:run`;
    
    
    /*** Get the access token and call the identity API ***/
    function xhr() {
        getTokenStorage(function(token){
            if(!token){
                console.log(TAG,"No auth token saved in storage. Please click on the extension icon to do authorization first.");
                return;
            }
            var fetchOptions = {
                method:'POST',
                headers:{
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: payload
            };
            fetch(POST_URL,fetchOptions).then(response=>{
                responseHandler(response);
                return response.json();
            })
            .then(data=>console.log(TAG,`Server response body:`,data))
            .catch(err=>console.log(TAG, `Request error.`,err));
            function responseHandler(response){
                console.log(TAG,`Server responded with status code ${response.status}.`);
                if(response.ok){
                    console.log(TAG,`Request sent sent successfully.`);
                } else if(response.status==401 && retry){
                    console.log(TAG,`Request failed. Retrying with another token.`);
                    retry = false;
                    chrome.identity.removeCachedAuthToken({ 'token': token }, function(){getTokenRemoteAndCache(xhr)});
                } else {
                    console.log(TAG,`Request failed with unknown solution.`);
                }
            }
        });
    }
    xhr();
}
  
/**
 * Called when receives message from a tab's content script
 */
function onTabMessageListener(request, sender, sendResponse){
    let TAG = "onTabMessageListener";
    let tabId = sender.tab.id;
    console.log(TAG,`TabId ${tabId}: sent: `,request);  
    let payload = getTabListInstance()[tabId];  // gets parameters assigned to this tab id
    if(request==='ready'){
        //sends params to content script
        payload = JSON.stringify(payload);
        sendMessageContentScript(tabId,payload);    // sends the encoded param to content script in the tab
        console.log(TAG,'Sent message to content script at ',tabId,sender.tab.url,payload);
        return;
    }
    request = JSON.parse(request);
    let tabList = getTabListInstance();
    // console.log(TAG,'xhr condition: ',!isMessageMatchFormat(request),tabList[tabId]==undefined);  // debuggin
    if(!isMessageMatchFormat(request) || tabList[tabId]==undefined) // checks if message invalid or this tab is not tracked
        return;  // ensures sender's message contains our data
    chrome.tabs.remove(tabId);  // closes the tab sending data.
    let args = {    // TODO: inspect args to see why we are not calling the right API
        ...request,
        timeout:payload.params.timeout //! gets timeout param from payload assigned to this tab id
    }
    let xhrPayload = generatePayload(args,request.type); // creates payload for calling GAS API
    console.log(TAG,`Tab #${tabId}: generated payload: `,xhrPayload);
    xhrWithAuth(xhrPayload);
}
/**
 * Handles messages from popup.html
 */
function onPopupMessageListener(request,sender,sendResponse){
    if(request == 'authorize'){
        getTokenRemoteAndCache(function(token){
            console.log("New token saved: "+token);
            sendResponse('Authorized');
        });
    } else if (request=='update_status'){
        getTokenStorage(function(token){
            console.log('Latest auth token in storage:',token);
            var msg = token?'Authorized':'Not authorized';
            sendResponse(msg);
        });
    } else if(request=='test'){
        console.log('Test started.');
        xhrWithAuth(generatePayload({
            val:'hello!',
            row:6,
            timeout:60*1000
        },'comment'));  // TODO: change params
    } 
    else{
        console.log("Request wrong format: "+request);
    }
}
// Events subscribing
chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
chrome.runtime.onMessage.addListener(function(req,s,res){
    if(s.tab) {     // checks if message comes from a tab
        onTabMessageListener(req,s,res)
    } else{
        onPopupMessageListener(req,s,res);
    }
    return true;
});
