// Supportive methods for making the comment
function stimulateKeyboardInput(target, options){
    let payload = {
        bubbles:true,
        cancelBubble:false,
        cancelable:true,
        composed:true,
        isTrusted:true,
        view:window
    };
    options = {...options,...payload};
    let optionsInput = {data:options.key,...payload};
    console.log('keyboard:',options,'input:',optionsInput);   //debugging    
    target.focus(); // backup for failing focus event
    target.click(); // backup for failing focus event
    let events = [new FocusEvent('focus'), new KeyboardEvent('keydown',options), new KeyboardEvent('keypress',options), new InputEvent('input',optionsInput), new KeyboardEvent('keyup',options)];
    events.forEach(e=>target.dispatchEvent(e));  
    console.log('done');//debugging
}
/**
 * Shortcut to gets common key options
 */
function getKeyOptions(isSpace=true){
    return isSpace?{key:' ',keyCode:32,code:'Space'}
                    :{key:'Enter',keyCode:13,code:'Enter'};
}
function getDocumentHeight(){
    var body = document.body, html = document.documentElement;
    var height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
    return height;
}
/**
 * Gets all comment elements in the page
 */
function getCommentElements(){
    let ulists = document.querySelectorAll('div[data-visualcompletion="ignore-dynamic"] ul');
    // console.log('ulists:',ulists, ulists.length==1);  // debugging
    if(ulists.length==1)    // checks if there are no other comments
        return [];
    return ulists[0].children;  // returns list of comment options elements (for: like, url,..)
}
function getCmtDiv(){
    return document.querySelector('form:last-child div[contenteditable="true"]');     // gets the main comment element
}
function getSpanIn(cmtDiv){
    return cmtDiv.querySelector('span[data-text="true"]');
}
/**
 * Main method to make the comment on script injected
 */
function makeComment(comment, callback){
    const TAG = 'makeComment';
    let interval = 1000; // sets a small interval
    console.log(TAG,'Started');
    let t = setInterval(function(){
        console.log(TAG,'checking webpage loaded..');
        let cmtDiv = getCmtDiv();
        if(!cmtDiv) // checks if youtube has not finished loading
            return; 
        clearInterval(t);   // stops checking if webpage is loaded
        console.log(TAG,'making comment..');
        let t4 = setInterval(()=>{  // keeps try to make comment
            cmtDiv = getCmtDiv();
            stimulateKeyboardInput(cmtDiv,{key:' ',keyCode:32,code:'Space'});
            let span = getSpanIn(cmtDiv);
            if(!span){   // checks if not found span element
                return;
            }
            clearInterval(t4);
            span.innerHTML = comment;
            stimulateKeyboardInput(cmtDiv,{key:' ',keyCode:32,code:'Space'});
    
            let cmtElmsCount = getCommentElements().length; // counts the comment elements
            stimulateKeyboardInput(getCmtDiv(),getKeyOptions(false));   // makes comment
            var t3 = setInterval(function(){    // keeps trying this function
                let currElms = getCommentElements();    // gets list of comment elements
                console.log(cmtElmsCount,'->',currElms.length);   // debugging
                if(currElms.length== cmtElmsCount)   // checks if no new comment has been made
                    return;
                var cmtElm = currElms[currElms.length-1]; // gets the last comment element
                console.log('cmtElm:',cmtElm);  // debugging
                let cmtUrl = cmtElm.querySelector('ul:last-child li:last-child a');  // gets the comment url element
                if(!cmtUrl){    // checks if cmtUrl has not been found
                    return;
                }
                cmtUrl = cmtUrl.href;   // gets the url of this anchor tag
                clearInterval(t3);  // stops trying
                console.log('cmtUrl:',cmtUrl);   // debugging
                callback(cmtUrl);  // calls the callback method with the comment url
            },interval);
        }, interval);
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
function openStubWindow(){
    let stubWindow = window.open('about:blank','_blank',"width:500,height:300");
    stubWindow.document.body.style.backgroundColor="#1167b1";
    let h2 = stubWindow.document.createElement('h2');
    stubWindow.document.body.appendChild(h2);
    h2.innerText = "[Facebook CT] stub tab will be closed automatically..";
    h2.style.color = '#fff';
    return stubWindow;
}
/**
 * Gets the option button of the last comment.
 * Returns the last options button, or null if it doesn't exists (not loaded).
 */
function getOptionsButton(){
    let btns = document.querySelectorAll('div[aria-label="Edit or delete this"]:last-child');   // get the options buttons of all comments
    return btns.length>0?btns[btns.length-1]:null;     // returns last options button
}
/**
 * Gets the div container for the edit or delete container that pops up when click on an options button.
 * This container will be empty if no edit or delete container is active, i.e. no options button clicked.
 */
function getEditOrDeleteContainer(cb){
    return document.querySelector('div[id^="mount"] > div > div:nth-child(1) > div > div.rq0escxv.l9j0dhe7.du4w35lb > div > div > div:nth-child(2) > div');
}
/**
 * Gets the popup element's container, e.g: the popup warning to confirm delete.
 * Returns the div container for popup elements.
 */
function getPopupContainer(){
    return document.querySelector('div[id^="mount"] > div > div:nth-child(1) > div > div:nth-child(7) > div');
}
/**
 * Observes changes in DOM tree with subtree observating being false by default.
 * Returns the observer.
 */
function observeDomMutation(target, cb,subtree=false){
    let config = {childList:true, subtree};
    let observer = new MutationObserver(cb);
    observer.observe(target,config);
    return observer;
}
/**
 * Entry function to delete the last comment on the comment page.
 */
function deleteComment(cb){
    const TAG = 'deleteComment';
    let interval = 1000; // sets a small interval
    console.log(TAG,'Started');
    let t = setInterval(function(){
        console.log(TAG,'checking webpage loaded..');
        let optionsBtn = getOptionsButton();
        let eodContainer = getEditOrDeleteContainer();
        let popupContainer = getPopupContainer();
        if(!(optionsBtn && eodContainer && popupContainer)) // checks if the options button is not ready yet
            return; 
        clearInterval(t);   // stops checking the options button
        console.log(TAG,'deleting comment..');
        console.log(eodContainer,popupContainer);   //debugging
        let eodObserver = observeDomMutation(eodContainer,mutations=>{    // observes DOM changes in edit or delete container
            console.log('eodContainer mutated',mutations);  // debugging
            let tClickDelBtn = setInterval(()=>{
                let delBtn = eodContainer.querySelector('div[role="menuitem"]:last-child');    // gets the delete button
                if(!delBtn){ // checks if delete button has not loaded
                    return;
                }
                clearInterval(tClickDelBtn);
                delBtn.click(); // clicks the delete button
            },interval);
        })
        let popupObserver = observeDomMutation(popupContainer,mutations=>{  // observes DOM changes in popup container
            console.log('popupContainer mutated',mutations);  // debugging
            let tClickConfirmBtn = setInterval(()=>{
                let confirmBtn = popupContainer.querySelector('div[aria-label="Delete"]');    // gets the delete button in the popup element
                if(!confirmBtn){    // checks if confirm button has not loaded
                    return;
                }
                clearInterval(tClickConfirmBtn);
                confirmBtn.click(); // deletes comment
            },interval);
        })
        let cmtsCount = getCommentElements().length;    // gets current comments count
        optionsBtn.click(); // clicks the options to makes eod pops up
        let tCountComments = setInterval(()=>{  // does intervally
            let cmtElms = getCommentElements();
            console.log(cmtElms.length, cmtsCount, cmtElms.length>=cmtsCount);   // debugging
            if(cmtElms.length>=cmtsCount){  // checks if comments count has not changed
                return;
            }
            clearInterval(tCountComments);
            eodObserver.disconnect();   // stops observing (thread safe)
            popupObserver.disconnect();
            console.log(globalThis.locked); // debugging
            if(globalThis.locked==undefined){   // checks if this is first call after deletion detected
                console.log(TAG,'calling callback');
                globalThis.locked = true;   // sets the asycn lock
                cb();   // executes the callback
            } else{ // checks if the lock has been set
                return;
            }
        },interval);
        
    },interval);
}
/**
 * Main procedure after received arguments
 */
function main(args){
    const TAG = 'main';
    let type = args.type;
    if(type=='comment'){   // checks if the args is for making comment
        let stubWindow = openStubWindow();  // opens stub window to redirect the focus
        let {comment, row} = args.params;   // extracts comment and row value from arguments
        makeComment(comment, function(val){
            let msgPayload = JSON.stringify({row,val,type}); // creates correct format object to send to the extension
            sendMessageExtension(msgPayload, stubWindow.close);
            setInterval(function(){sendMessageExtension(msgPayload, stubWindow.close)}, 30*1000) // sends message to extension every 30s
        });
    } else{ // checks if the args is for deleting comment
        let {row} = args.params;    // extracts the row value from received params
        deleteComment(()=>{
            let val = 'comment deleted';    // sets the value of the status to send
            let msgPayload = JSON.stringify({row,val,type});
            console.log(TAG,msgPayload);
            sendMessageExtension(msgPayload);
            setInterval(function(){sendMessageExtension(msgPayload)}, 30*1000) // sends message to extension every 30s
        })
    }
}

if(!globalThis.existed){    // checks if the content script is injected before
    globalThis.existed = true;  // helper variable showing the content script is injected before
    // sends message to extension to get parameters
    sendMessageExtension('ready');
    // listens for messages
    chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
        const TAG = 'onMessage';
        request = JSON.parse(request);
        console.log(TAG, 'Received message: ',request, 'Sender: ',sender);
        main(request);  // runs main procedure
    })
} else{
    console.log('Content script already injected. Skipping initialization');    // debugging
}