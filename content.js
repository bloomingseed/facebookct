// Supportive methods to defines document ready state
function first2DegNode(elm){
    // console.log(elm, elm.children, elm.children?elm.children.length:null);  // debug
    if(elm.children.length==2)
        return elm;
    return first2DegNode(elm.parentElement)
}
function findSvgContainer(root){
    if(root.firstChild.tagName=='svg')
        return root;
    return findSvgContainer(root.firstChild)
}
function getCommentFormElement(){
    return document.querySelector('form:last-child');
}
function isDocumentReady(){
    let formElm = getCommentFormElement();
    if(!formElm){   // checks if not foudn formElm
        return false;
    }
    let container = findSvgContainer(first2DegNode(formElm.parentElement));
    return container.children.length==2;    // returns if the container has 2 children
}
// Supportive methods for making the comment
function stimulateKeyboardInput(target, options){
    // 	let options = isSpaceKey?{code:"Space",key:" ",keyCode:32,bubbles:true, cancelBubble:false}
    //                             :{code:"Enter",key:"Enter",keyCode:13,bubbles:true, cancelBubble:false};
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
    // let events = [new FocusEvent('focus'), new KeyboardEvent('keydown',options), new KeyboardEvent('keypress',options), new KeyboardEvent('keyup',options)];
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
// function solve(root, cb){
// 	let queue = [];
//     queue.push(root);
//     while(queue.length>0){
//         let node = queue.shift();	// pop head
//         cb(node);
//         let children = node.children;
//         for(let i = 0; i<children.length; ++i){
//             queue.push(children[i]);
//         }
//     }
// }
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
    console.log('ulists:',ulists, ulists.length==1);  // debugging
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
        // if(!isDocumentReady()){ // checks if document not ready to make comment
        //     return;
        // }
        let cmtDiv = getCmtDiv();
        if(!cmtDiv) // checks if youtube has not finished loading
            return; 
        clearInterval(t);   // stops checking if webpage is loaded
        // let height = getDocumentHeight();   // gets current full document height
        // scrollBy(0,height);  // scrolls to bottom of page
        
        console.log(TAG,'making comment..');
        // let cmtDiv = getCmtDiv();
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
        // stimulateKeyboardInput(cmtDiv,{key:' ',keyCode:32,code:'Space'});
        // let span = getSpanIn(cmtDiv);
        // span.innerHTML = comment;
        // stimulateKeyboardInput(cmtDiv,{key:' ',keyCode:32,code:'Space'});

        // let cmtElmsCount = getCommentElements().length; // counts the comment elements
        // stimulateKeyboardInput(getCmtDiv(),getKeyOptions(false));   // makes comment
        // var t3 = setInterval(function(){    // keeps trying this function
        //     let currElms = getCommentElements();    // gets list of comment elements
        //     console.log(cmtElmsCount,'->',currElms.length);   // debugging
        //     if(currElms.length== cmtElmsCount)   // checks if no new comment has been made
        //         return;
        //     var cmtElm = currElms[currElms.length-1]; // gets the last comment element
        //     console.log('cmtElm:',cmtElm);  // debugging
        //     let cmtUrl = cmtElm.querySelector('ul:last-child li:last-child a');  // gets the comment url element
        //     if(!cmtUrl){    // checks if cmtUrl has not been found
        //         return;
        //     }
        //     cmtUrl = cmtUrl.href;   // gets the url of this anchor tag
        //     clearInterval(t3);  // stops trying
        //     console.log('cmtUrl:',cmtUrl);   // debugging
        //     callback(cmtUrl);  // calls the callback method with the comment url
        // },interval);
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
/**
 * Main procedure after received arguments
 */
function main(args){
    const TAG = 'main';
    let type = args.type;
    if(type=='comment'){   // checks if the args is for making comment
        let {comment, row} = args.params;   // extracts comment and row value from arguments
        makeComment(comment, function(val){
            let msgPayload = JSON.stringify({row,val,type}); // creates correct format object to send to the extension
            // sendMessageExtension(msgPayload, window.close); // sends message then close
            sendMessageExtension(msgPayload); // sends message to extension
        });
    } else{ // checks if the args is for deleting comment
        // TODO
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