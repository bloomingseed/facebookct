// function injectJquery(){
//     let scriptElm = document.createElement('script');
//     scriptElm.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
//     document.body.appendChild(scriptElm);
// }
function validateRequest(request){
    return  typeof(request.timeout)!='number' 
            || typeof(request.row)!='number' 
            || typeof(request.col)!='number'
            || typeof(request.comment)!='string'
            || typeof(request.sheetName)!='string';
}
function getViewportHeight(){
    return document.documentElement.clientHeight;
}
function getDocumentHeight(){
    let body = document.body;
    let html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
}
function getCommentElements(){
    let selector = '#header-author > yt-formatted-string > a';  // defines the selector
    return document.querySelectorAll(selector);
}
function stimulateKeyboardInput(target){
	let options = {code:"Space",key:" ",keyCode:32};
    let optionsInput = {data:' '};
        let events = [new FocusEvent('focus'), new KeyboardEvent('keydown',options), new KeyboardEvent('keypress',options), new InputEvent('input',optionsInput), new KeyboardEvent('keyup',options)];
    events.forEach(e=>target.dispatchEvent(e));  
    console.log('done');//debugging
}
function solve(root, cb){
	let queue = [];
    queue.push(root);
    while(queue.length>0){
        let node = queue.shift();	// pop head
        cb(node);
        let children = node.children;
        for(let i = 0; i<children.length; ++i){
            queue.push(children[i]);
        }
    }
}
function makeComment(comment, callback){
    const TAG = 'makeComment';
    let interval = 1000; // sets a small interval
    console.log(TAG,'Started');
    let t = setInterval(function(){
        console.log(TAG,'checking webpage loaded..');
        if(getViewportHeight()/getDocumentHeight()>0.7) return; // checks if youtube has not finished loading
        clearInterval(t);   // stops checking if webpage is loaded
        let height = getDocumentHeight();   // gets current full document height
        scrollBy(0,getViewportHeight()/2);  // scrolls to half viewport height
        
        let t2 = setInterval(function(){
            console.log(TAG,'checking comments loaded..');
            // if(height==getDocumentHeight()) return; // check if document height not changed
            
            let commentBox = document.querySelector('#placeholder-area');    // gets the clickable comment box
            if(commentBox==null) {
                scrollBy(0,getViewportHeight()/2);
                height = getDocumentHeight();   // sets the height to current document height
                return;
            }
            
            clearInterval(t2);
            console.log(TAG,'making comment..');
            commentBox.click();     // clicks onto the box so DOM renders the input area
            let commentInput = document.querySelector('#contenteditable-root');     // gets youtube comment input element
            commentInput.innerText = comment;   // sets the comment
            let root = document.querySelector('#creation-box');
            solve(root,stimulateKeyboardInput);     // sends key input to all these elements
            let commentButton = document.querySelector('#submit-button');
            console.log(TAG,'comment ready');
            commentButton.click();  // clicks comment button
            let urls = getCommentElements();
            let t3 = setInterval(function(){
                let currUrls = getCommentElements();
                if(currUrls.length<= urls.length) return;
                
                clearInterval(t3);
                callback(currUrls[0].href);
            },interval);
        },interval);
    },interval);
}
function sendMessageExtension(message,callback){
    const TAG = 'sendMessageExtension';
    chrome.runtime.sendMessage(message);
    console.log(TAG,'A message was sent to extension side: ',message);
    if(typeof(callback)=='function') {
        callback();
    }
}
function main(args){
    // calls makeComment after `timeout` interval
    const TAG = 'main';
    var timeout = args.timeout;
    console.log(TAG, 'Started. Waiting until comment process: ',timeout+'ms');
    setTimeout(function(){
        makeComment(args.comment, function(commentUrl){
            console.log(TAG, 'Got comment URL: ',commentUrl);
            sendMessageExtension({commentUrl,row:args.row,col:args.col,sheetName:args.sheetName}, function(){
                window.close();
            });    // sends the url href to extension side
        });
    },timeout);
}
// sends message to extension to get parameters
sendMessageExtension('ready');
// listens for messages
chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    const TAG = 'onMessage';
    request = JSON.parse(request);
    console.log(TAG, 'Received message: ',request, 'Sender: ',sender);
    if(!sender.tab){    // checks if the message comes from the extension
        if(!validateRequest(request)){
            console.error({message:'Parameters invalid.',request:request});
        } else{
            console.log(TAG,'Received parameters: ',request);
            main(request);
        }
    }
})