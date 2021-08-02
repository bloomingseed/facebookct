const authBtn = document.querySelector('#authBtn');
const statusBtn = document.querySelector('#statusBtn');
const testBtn = document.querySelector('#testBtn');
const para = document.querySelector('#para');
const KEY = 'token';  // the key in local storage to get auth token
authBtn.addEventListener('click',function(){sendMessageExtension('authorize')});
statusBtn.addEventListener('click',function(){sendMessageExtension('update_status')});
testBtn.addEventListener('click',function(){sendMessageExtension('test')});

function sendMessageExtension(msg){
    chrome.runtime.sendMessage(msg, function(response){
        if(!response){
            para.innerHTML = `<span style="color:red;">${chrome.runtime.lastError.message}.</span>`
        } else{
            para.innerHTML = `<i>${response}</i>`;
        }
    });
}