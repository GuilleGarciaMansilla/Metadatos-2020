/*
Orden de ejecucion:

1.onBeforeRequest
2.onBeforeSendHeaders
3.onSendHeaders
4.onHeadersReceived

5.onAuthRequired
6.onBeforeRedirect
7.onResponseStarted

8.onCompleted

*/
var idRequest;
var stream;
//Funcion callback del action listener de onBeforeRequest
function requestHandlerBody(details){
  if(details.method == "POST"){
    stream = details;
  }
  
}
//Funcion callback del action listener de onBeforeSendHeaders
function requestHandlerHeader(details){
    
  for (var i = 0; i < details.requestHeaders.length; ++i) {
    //Filtramos las cabeceras POST
    if(details.method =="POST"){
       //Filtramos los contenidos de la cabecera por content-type
      if(details.requestHeaders[i].name.toLowerCase() === 'content-type'){
        //Dentro de los content-type solamente queremos los multipart
        if(details.requestHeaders[i].value.toLowerCase().includes("multipart/related") || details.requestHeaders[i].value.toLowerCase().includes("multipart/form-data")){
          //Recogemos la id de la peticion para utilizarla en el body
          idRequest = details.requestId;
          console.log("Tenemos header ","ID: ",idRequest);
          console.log("Header: ",details);
          if(stream.requestId == idRequest){
            console.log("Tenemos body ","ID: ",stream.requestId);
            console.log("Body: ",stream)
          }
        }
      }
    }
      
  }
  
}
//Funcion callback del action listener de onHeadersReceived
function requestHandlerHeaderRcv(details){
  //  console.log("Headers:", details);
  for (var i = 0; i < details.responseHeaders.length; ++i) {
    if( details.responseHeaders[i].name === 'content-type'){
      console.log(details.responseHeaders[i].value);
    }
        
  }
}

//,types: ["xmlhttprequest"]
// enctype='multipart/form-data'
function setListeners() {
  chrome.webRequest.onBeforeSendHeaders.addListener(requestHandlerHeader,
                                                    {urls: ["<all_urls>"]},
                                                    
                                                    ["requestHeaders","blocking"]);
  //  chrome.webRequest.onHeadersReceived.addListener(requestHandlerHeaderRcv,
  //                                                   {urls: ["<all_urls>"]},
                                                    
  //                                                   ["responseHeaders","blocking"]);                                              
  chrome.webRequest.onBeforeRequest.addListener(requestHandlerBody,
                                                {urls: ["<all_urls>"]},
                                                ['requestBody']);
   
  // chrome.webRequest.onCompleted.addListener(requestHandler,
  //                                          {urls: ["<all_urls>"]});
}
function removeListeners() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(requestHandler);
  chrome.webRequest.onBeforeRequest.removeListener(requestHandler);
  chrome.webRequest.onCompleted.removeListener(requestHandler);
}
//Con esta funcion igual se puede llegar a ver el body a trozos//prototipo!!!!!!!!
function onBeforeRequestHandler(req) {
  
  if (req.requestBody && req.requestBody.raw) {
    var requestBody = req.requestBody.raw.map(function(data) {
      return decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(data.bytes)));
    }).join('')
    console.log(requestBody);
  }

}
setListeners();