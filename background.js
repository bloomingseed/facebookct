function isYoutubeUrlMatchFormat(url,output){
    let parts = url.split('?');
    if(parts.length!=2) return false;
    if(parts[0]!='https://www.youtube.com/watch') return false;
    let q = new URLSearchParams(parts[1]);
    let arr = ['timeout','comment','row','col','sheetName'];
    for(let key of arr){
        if(q.get(key)==null) return false;
        output[key] = q.get(key);
    }
    return true;
}
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
    console.log(`TabId ${tabId}, Url ${tab.url}: updated.`);
    let output = {};
    let url = tab.url;
    if(!isYoutubeUrlMatchFormat(url,output)) return;    // ensures this url matches our format
    console.log(TAG,`TabId ${tabId}, Url ${tab.url}: Detected a matched Youtube URL. Parameters:`,output);
    let tabList = getTabListInstance();
    if(tabList[tabId]!=undefined) return;  // ensures this tab id is not listed
    tabList[tabId]=output;    // adds this tab id to list
    chrome.scripting.executeScript({    // inject content.js script
        target:{tabId},
        files: ['content.js']
    });
    console.log(`TabId ${tabId}, Url ${tab.url}: script injected.`);
}
function generatePayload(args){
    const FUNC_NAME = 'setValue';
    return JSON.stringify({
        "function": FUNC_NAME,
        "parameters": [args.commentUrl, args.row, args.col, args.sheetName]
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
function xhrWithAuth(args) {
    const TAG = 'xhrWithAuth';
    var retry = true;    
    const PAYLOAD = generatePayload(args);
    // const API_KEY = 'AIzaSyBoOa9ile3fk8_dEo4DRMEzD2g4uRdvLI8';
    // const SCRIPT_ID = 'AKfycbxdp2tFOBq2XcKm_oZdj-oUbnn_SozhRwJeDE6mkgmjFtjevJ49iqoEVFVsmGhS7Pi4';
    const DEPLOYMENT_ID = 'AKfycbx24LtTDu5pqt-fr4dvYvHZVmF02hcS2qNNY31tEIwgz7ECw0kjH7lmxwA0mv9wFQkc';
    const POST_URL = `https://script.googleapis.com/v1/scripts/${DEPLOYMENT_ID}:run`;
    
    
    /*** Get the access token and call the identity API ***/
    function getToken() {
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
                body: PAYLOAD
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
                    chrome.identity.removeCachedAuthToken({ 'token': token }, function(){getTokenRemoteAndCache(getToken)});
                } else {
                    console.log(TAG,`Request failed with unknown solution.`);
                }
            }
        });
    }
    getToken();
}
  

function isMessageMatchFormat(msg){
    let arr = ['commentUrl','row','col'];
    for(let key of arr){
        if(msg[key]==undefined) return false;
    }
    return true;
}
/**
 * Called when receives message from a tab
 */
function onTabMessageListener(request, sender, sendResponse){
    var TAG = "onTabMessageListener";
    var tabId = sender.tab.id;
    console.log(TAG,`TabId ${tabId}: sent: `,request);  
    if(request==='ready'){
        //sends params to content script
        var payload = JSON.stringify(getTabListInstance()[tabId]);
        sendMessageContentScript(tabId,payload);
        console.log(TAG,'Sent message to content script at ',tabId,sender.tab.url,payload);
        return;
    }
    if(!isMessageMatchFormat(request)) return;  // ensures sender's message contains our data
    let tabList = getTabListInstance();
    if(tabList[tabId]==undefined) return;  // ensures this tab id is in the list
    delete tabList[tabId];  // removes this tab id from the listed tabIds
    let args = {
        'commentUrl': request.commentUrl,
        'row':request.row,
        'col':request.col,
        'sheetName':request.sheetName
    };
    // TODO: call GAS using Execution API here
    xhrWithAuth(args);
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
        // TODO: check local auth token; status: no token, token expired, token ready
    } else if(request=='test'){
        console.log('Test started.');
        xhrWithAuth({commentUrl:'done',col:5,row:15});
    } 
    else{
        console.log("Request wrong format: "+request);
    }
}
// Events subscribing
try{
    chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
    chrome.runtime.onMessage.addListener(function(req,s,res){
        if(s.tab) {     // checks if message comes from a tab
            onTabMessageListener(req,s,res)
        } else{
            onPopupMessageListener(req,s,res);
        }
        return true;
    });
} catch(e){console.log(e);}
