/* Cammon JS */
var deployementId = "21d8b1f2-0ff4-4e4b-947b-ed49de2fd36f";
var wssUrl = "wss://webmessaging.mypurecloud.de/v1?deploymentId=" + deployementId;
var apiUrl = "https://api.mypurecloud.de";
var parameters = null; //getAllParameters();
var token = null; //parameters['uuid'];// guest_20250115011236_00000001 (Burada her müşteri için uniq bir uuid değeri olmalıdır.)
var conversationId = null;
var firstMessage = null;
var jwtToken = null;
var webSocket;
var access_token;
var forConId = null;
var conversationId;
var allowedFileTypes = null;
var blockedExtensions = null;

function startNewChat(_startData) { //(_startMessage = null) {
    //firstMessage = _startMessage;

    const _jsonData = JSON.parse(_startData);
    parameters = _jsonData;
    token = _jsonData.uuid;
    
    pLanguage = parameters['appLanguage'];
    if(!pLanguage || pLanguage.length < 1) { 
        pLanguage = "en";
    }
    else {
        pLanguage = pLanguage.slice(0,2);
    }
    setLocalization(pLanguage);

    if(token==null || token==undefined || token==""){
        alert("Please provide the uuid value.")
    }
    else {
        //getTokenFromUUID(parameters['uuid']); // Token alıyoruz
        startConnection(wssUrl); // Wss bağlantısını yapıyoruz  
    }
}

// _startNew default olarak false gönderilmelidir, sadece SessionResponse readOnly = true ise _startNew = true olarak gönderilmelidir
function createNewSession(_startNew = false) {
    var tokenData = {
        "action": "configureSession",
        "deploymentId": deployementId,
        "token": token,
        "startNew": _startNew
    }
    
    if (webSocket) {
        webSocket.send(JSON.stringify(tokenData)); // Token ile yeni bir session oluşturuyoruz
    }
}

function sendMessage(message, isHidden = false) {
    // DOMPurify, HTML içeriğini güvenli hale getirir.
    var cleanMessage = DOMPurify.sanitize(message);
    cleanMessage = sanitizeInput(cleanMessage);      

    var currentDate = new Date();
    if (!isHidden) {
        addNewMessage("participant", linkify(cleanMessage), timeFormatter(currentDate)); // Müşterinin mesajını ekle
    }

    sendBotMessage(parameters.name, parameters.uuid, parameters.name, parameters.name, cleanMessage)
        .then(botResponse => {
            if (botResponse != null && botResponse.status === 1) { // Bot ile görüşme devam ediyorsa        
                var _currentDate = new Date();
                addNewMessage("agent", linkify(botResponse.response), timeFormatter(_currentDate)); // Botun son mesajını müşteriye gönder
                return; // Agent a bu mesajı gönderme
            }
            else if (botResponse != null && botResponse.status === 2 && botResponse.conversation_summary != null && botResponse.conversation_summary != "") { // Bot ile görüşme sonlandıysa ve agent a yönlendirme varsa
                var _currentDate = new Date();
                var _botRedirectMessage = `هسه راح أحولك على زميلي المختص، يرجى الانتظار للحظة. شكرًا جزيلاً على صبرك وتفهمك. 
You are being transferred to a senior colleague. Please hold on for a moment. We appreciate your patience.`;
                addNewMessage("agent", linkify(_botRedirectMessage), timeFormatter(_currentDate)); // Agent a yönlendirme mesajı müşteriye gönder
                cleanMessage = botResponse.conversation_summary; // Botun özet mesajını agent a gönder
            }

            if(!webSocket) {
                startNewChat(message);
            }
            else {        
        
                var sendMessageData = {
                    "action": "onMessage",
                    "token": token,
                    "message": {
                        "type": "Text",
                        "text": cleanMessage,
                        "channel": {
                            "metadata": {
                                "customAttributes": parameters 
                            }
                        }
                    }
                } 

                if(cleanMessage.length > 4000) {
                    const splitChunks = splitText(cleanMessage);
                    splitChunks.forEach((element, index) => {
                        sendMessageData.message.text = element;
                        setTimeout(() => {
                            webSocket.send(JSON.stringify(sendMessageData));
                        }
                        , index * 500); // Her mesajı 0,5 saniye arayla gönder
                    });
                }
                else {
                    webSocket.send(JSON.stringify(sendMessageData));
                } 
           
                /*setTimeout(() => {
                    var currentDate = new Date();
                    var message = $.t("system-message.chat-started");
                    addNewMessage("system", message, timeFormatter(currentDate));
                }, 500);*/
            }
        })
        .catch(() => {
            // Agent a mesaj gönder
			if(!webSocket) {
				startNewChat(message);
			}
			else {
				// DOMPurify, HTML içeriğini güvenli hale getirir.
				var cleanMessage = DOMPurify.sanitize(message);
				cleanMessage = sanitizeInput(cleanMessage);

				var sendMessageData = {
					"action": "onMessage",
					"token": token,
					"message": {
						"type": "Text",
						"text": cleanMessage,
						"channel": {
							"metadata": {
								"customAttributes": parameters 
							}
						}
					}
				} 

				webSocket.send(JSON.stringify(sendMessageData));
		   
				/*setTimeout(() => {
					var currentDate = new Date();
					var message = $.t("system-message.chat-started");
					addNewMessage("system", message, timeFormatter(currentDate));
				}, 500);*/
			}
        });
}
var attachmentData = {
    attachmentId: null,
    xAmzTagging: null,
    url: null
};

function sendPresigned(fileName,fileType,message,callback, ) {
    if(!webSocket) {
        startNewChat(message);
    }
    else {
        var sendData = {
            "action": "onAttachment",
            "fileName": fileName,
            "fileType": fileType,
            "fileSize": 10385760,
            "tracingId": "12232424",
            "token": token
        };

        webSocket.pendingCallback = callback;
        webSocket.send(JSON.stringify(sendData));
        var message = $.t("upload-status.uploading");
        showMessage(
            message,
            "#007BFF",
            "block",
            false
        );
    }
}

function sendFinish(id) {
    if(!webSocket) {
        startNewChat(message);
    }
    else {
        var sendData = {
            "action": "onMessage",
            "message": {
                "content": [
                    {
                        "contentType": "Attachment",
                        "attachment": {
                            "id": id
                        }
                    }
                    ]
                },
            "tracingId": "12232424",
            "token": token
        };

     webSocket.send(JSON.stringify(sendData));
    }
}

function sendTyping() {
    if(webSocket) {
        var sendTypingMessageData = {
            "action": "onMessage",
            "message": {
              "type": "Event",
              "events": [
                {
                  "eventType": "Typing",
                  "typing": {
                    "type": "On"
                  }
                }
              ]
            },
            "token": token
        };

        webSocket.send(JSON.stringify(sendTypingMessageData));
    }
}

/*
function exitCurrentChat() {
    var _conversationId = getCookie("cxConversationId");
    var _memberId = getCookie("cxMemberId");
    var _jwt = getCookie("cxJwt");

    if (_conversationId.length > 0 && _memberId.length > 0) {
        $.ajax({
            type: "DELETE",
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' ,
                'Authorization': 'Bearer ' + _jwt
            },
            url: serverUrl + "/api/v2/webchat/guest/conversations/"+_conversationId+"/members/"+_memberId,
            success: function(data, textStatus, request) {
                console.log("Chat ended: ");
                console.log(data);
                
                var message = $.t("system-message.chat-ended");
                addNewMessage("system", message, timeFormatter(data?.eventBody?.timestamp));
                window.parent.postMessage("conversationEnded", pBaseUrl); // Sohbetin sonlandığı bilgisini ver.
                clearCookies();
            },
            error: function(data, textStatus, error) {
                console.log("End chat error: ");
                console.log("[Data] " + data);
            }
        });
    }
}*/

function startConnection(url){
    console.log("### Connection Start ###");
    webSocket = new WebSocket(url);

    webSocket.onopen = function(event) {
        streamOnOpen(event);
        setInterval(() => {
            if (webSocket.readyState === 1) {
                webSocket.send(JSON.stringify({ action: "echo", message: "keep-alive" }));
                //console.log("Keep-alive mesajı gönderildi.");
            }
        }, 30000); // 4 dakika (240000 ms) 30000
    };

    webSocket.onmessage = function(event) {
        streamOnMessage(event)
    };

    webSocket.onclose = function(event) {
        //console.log("[CLOSE] WebSocket kapandı. Kapanma nedeni:", event);
        streamOnClose(event);
    };

    webSocket.onerror = function(event) {
        streamOnError(event)
    };
}

// Sohbetin başaltıldığı token için bir jwt üretir, bu jwt wss içinden onMessage olarak gelir
function getJwtToken() {
    var jwtTokenMessageData = {
        "action": "getJwt",
        "token": token
      }

    if (webSocket) {
        webSocket.send(JSON.stringify(jwtTokenMessageData));
    }

}

// Sohbet için üretilen jwt kullanılarak, sohbetin hsitory si çekilebilir
function getMessageHistory() {
    if (token) {
        var historyUrl = apiUrl + "/api/v2/webmessaging/messages?pageSize=10&pageNumber=1";

        $.ajax({
            type: "GET",
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json' ,
                'Authorization': 'Bearer ' + jwtToken
            },
            url: historyUrl,
            success: function(data, textStatus, request) {
                console.log("History: ");
                console.log(data);

                // Mesaj alanına geçmiş mesajları yaz
                var entities = data.entities.reverse();

                forConId = entities.length > 0 ? entities[0].id : forConId; // Bir görüşme olduğuna dair id bilgisi

                // LocalStorage dan chat geçmişini alıyoruz ve mesaj alanına ekliyoruz.
                var cxChatHistory = localStorage.getItem("cxChatHistory2");
				cxMessages.html("");
                cxMessages.append(cxChatHistory);
                scroolToBottom();
                return;

                entities.forEach(entity => {
                if(entity.type == 'Text' && entity.direction == 'Inbound' && entity.text) {
                    addNewMessage("participant", linkify(entity.text), timeFormatter(entity.channel.time));
                } 
                else if(entity.type == 'Text' && entity.direction == 'Outbound' && entity.text) {
                    addNewMessage("agent", linkify(entity.text), timeFormatter(entity.channel.time));
                }
                else if(entity.type == 'Text' && entity.direction == 'Inbound' && entity.content) {
                    entity.content.forEach(content => {
                        content.attachment.url;
                        addNewFile("participant",null,content.attachment.filename,content.attachment.fileSize)
                    });
                } 
                else if(entity.type == 'Text' && entity.direction == 'Outbound' && entity.content) {
                    entity.content.forEach(content => {
                        content.attachment.url;
                        //addNewFile("agent",content.attachment.url,content.attachment.filename,content.attachment.fileSize);
                        addNewFile("agent",null,content.attachment.filename,content.attachment.fileSize);
                    });
                }
            });
            },
            error: function(data, textStatus, error) {
                console.log("History error: ");
                console.log(textStatus);
                console.log(error);
                console.log(data);
            }
        });
    }
}

// Görüşmenin müşteri tarafından sonlandırılmasını sağlar. Müşteri sohbeti sonlandırdıktan sonra aynı sohbet devam etmez ve yeni bir sohbet başlatmak zorunludur.
function exitCurrentChat() {
    if (forConId != null) {
        disconnectedConversation(forConId);
    }
    else {
        uiWidgetRemove();
    }
    /*if(webSocket){
        var closeSessionData = {
            "action": "onMessage",
            "message": {
              "type": "Event",
              "events": [
                {
                  "eventType": "Presence",
                  "presence": {
                    "type": "Disconneect"
                  }
                }
              ]
            },
            "token": token
          };

        webSocket.send(JSON.stringify(closeSessionData));
    }*/
}

/*var nameHere = parameters['name'];
var firstName = parameters['firstName'];
var lastName = parameters['lastName'];
var email = parameters['email'];
var phoneNumber = parameters['phoneNumber'];
var dateOfBirth = parameters['dateOfBirth'];
var mainCategory = parameters['mainCategory'];
var subCategory = parameters['subCategory'];
var language = parameters['language'];
var platform = parameters['platform'];
var memberId = parameters['memberId'];*/

var typingTimeout;
function streamOnMessage(event){
    var data = JSON.parse(event.data);
    //console.log("### MESSAGE ###" + JSON.stringify(data));

    if (data.type == "response") {
        if (data.class == "SessionResponse" && data.body.readOnly == true) {
            createNewSession(true); // Eğer başlattığımız session daha önce müşteri tarafından kapatıldıysa readOnly olacağından yeni bir mesajlaşma başlatmak için startNew = true olarak tekrar çağırıyoruz
        }
        else if (data.class == "SessionResponse" && data.body.connected == true) {
            // Session başladığında sohbet için bir jwtToken üretiyoruz
            getJwtToken();

            // Yüklenebilecek dosya bilgilerini alıyoruz.
            allowedFileTypes = data.body.allowedMedia.inbound.fileTypes; // [{type: "*/*"}, {type: "image/gif"},...]
            blockedExtensions = data.body.blockedExtensions; // [".ade", ".adp", ".app", ".asp",...]
            //var maxFileSizeKB = data.body.allowedMedia.inbound.maxFileSizeKB; // 10240
			
            /*history.entities.forEach(entity => {
                if(entity.type == 'Text' && entity.direction == 'Inbound') {
                    addNewMessage("participant", linkify(entity.text), timeFormatter(entity.channel.time));
                } 
                else if(entity.type == 'Text' && entity.direction == 'Outbound') {
                    addNewMessage("agent", linkify(entity.text), timeFormatter(entity.channel.time));
                }
            });*/

            //var languageName = $.t("language-name"); // Dil paketinden dilin adını alıyoruz. 

            // Parametre olarak gelen userdata verisini decode ederek json formatta veri elde ediyoruz
            //var userData = JSON.parse(Base64.decode(pUserData)); 
            //console.log("### MESSAGE ###"+userData);
        }
        else if (data.class == "JwtResponse" && data.body.jwt) {
            jwtToken = data.body.jwt;

            //var currentDate = new Date();
            //var message = $.t("system-message.chat-started");
            //addNewMessage("system", message, timeFormatter(currentDate));
                
            // Mesaj geçmişini çek
            getMessageHistory();
            
        }else if(data.class == "PresignedUrlResponse" && data.body.attachmentId !== undefined){
            const responseData = JSON.parse(event.data);
            // Verilerin olup olmadığını kontrol et
            if (responseData && responseData.body) {
                // İlgili verileri sakla
                attachmentData.attachmentId = responseData.body.attachmentId;
                attachmentData.xAmzTagging = responseData.body.headers["x-amz-tagging"];
               
                attachmentData.url = responseData.body.url;
                /*if (callback && typeof callback === "function") {
                    callback(attachmentData);
                }*/
                // Eğer sendPresigned çağrısı bir callback içeriyorsa, burada çağır
                if (webSocket.pendingCallback && typeof webSocket.pendingCallback === "function") {
                    webSocket.pendingCallback(attachmentData);
                    webSocket.pendingCallback = null; // Callback'i temizle
                }
           
            setTimeout(function() {
                document.getElementById("fileMessage").style.display = "none";
            }, 5000);
            } 
        }
    }

    if (data.type == "message") {
        /*if(data.class=="UploadSuccessEvent"){
            showMessage(
                "File Uploaded",
                "green",
                "block",
                true,
                3000,
                "none"
            )
            //addNewMessage("participant",linkify(data.body.downloadUrl),timeFormatter(data.body.timestamp));
            addNewFile("participant",data.body.downloadUrl,fileFullName,fileFullSize);
        }
        else */if (data.body.type == "Event" && data.body.direction == "Outbound") { // Gelen event
            if (data.body.events.find(event => event.eventType == "Typing" && event.typing.type == "On")) { // Agent yazıyor 
                $("#typing").show(); // Typing mesajı geldiğinde yazıyor metnini göster.

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    $("#typing").hide(); // Metni 5sn sonra otomatik olarak gizle.
                }, 5000);
            }
            else if (data.body.events.find(event => event.eventType == "Presence" && event.presence.type == "Disconnect")) { // Görüşme sonlandırıldı
                var message = $.t("system-message.agent-disconnected");
                addNewMessage("system", message, timeFormatter(data.body.channel.time));                
                window.parent.postMessage("conversationEnded", pBaseUrl); // Sohbetin sonlandığı bilgisini ver.
                //uiRedirectToSurvey(); // Görüşme agent tarafından sonlandırıldığında ankete yönlendirmiyoruz.
                uiDisableMessageArea(); // Yazı yazma alanını disable yapıyoruz.
                clearCookies();
            }
        }
        else if (data.body.type == "Text") { // Gelen mesaj
            forConId = data.body.id; // Bir görüşme olduğuna dair id bilgisi
            if (data.body.direction == "Outbound" && data.body.text) { // Agent mesajı
                addNewMessage("agent", linkify(data.body.text), timeFormatter(data.body.channel.time));
                
                
                $("#typing").hide(); // Mesaj gelince yazıyor kısmını gizle.
                messageSound(); // Mesaj gelince ses çal.
                
                window.parent.postMessage("newMessage", pBaseUrl); // Yeni mesaj geldiği bilgisini ver.
                newMessage(data.body.text, "agent") // Android ve IOS uygulamalarına yeni mesaj geldiği bilgisini gönder.
                
                try {
                    window.webkit.messageHandlers.iosHandler.postMessage({
                        method: "newMessage", 
                        message: data.body.text
                    }); // IOS uygulamalarına yeni mesaj geldiği bilgisini gönder.
                } catch (error) {
                    console.log(error);
                }

                // Agent bilgilerini aşağıdaki gibi alıp kullanabiliriz.
                //var agentNickName = data.body.channel.from.nickname;
                //var agentProfileImage = data.body.channel.from.image;
            }
            else if (data.body.direction == "Inbound" && data.body.text) { // Müşteri mesajı
                //addNewMessage("participant", linkify(data.body.text), timeFormatter(data.body.channel.time));
            }
            else if (data.body.direction == "Outbound" && data.body.content) { // Agent dan gelen içerik
                data.body.content.forEach(content => {
                    if (content.contentType == "Attachment") { // Gelen bir dosya
                        addNewFile("agent",null,data.body.content[0].attachment.filename,data.body.content[0].attachment.fileSize);
                        //addNewFile("agent",data.body.content[0].attachment.url,data.body.content[0].attachment.filename,data.body.content[0].attachment.fileSize);
                       // addNewMessage("agent", linkify(content.attachment.url), timeFormatter(data.body.channel.time));
                        $("#typing").hide(); // Mesaj gelince yazıyor kısmını gizle.
                        messageSound(); // Mesaj gelince ses çal.
                            
                        window.parent.postMessage("newMessage", pBaseUrl); // Yeni mesaj geldiği bilgisini ver.
                        newMessage(data.body.content[0].attachment.filename, "agent") // Android ve IOS uygulamalarına agent dan yeni dosya geldiği bilgisini gönder.
                    }
                });
            }
            else if (data.body.direction == "Inbound" && data.body.content) { // Müşteri den gelen içerik
                data.body.content.forEach(content => {
                    if (content.contentType == "Attachment") { // Gelen bir dosya
                        var message = $.t("upload-status.uploaded");
                        showMessage(
                            message,
                            "green",
                            "block",
                            true,
                            3000,
                            "none"
                        );

						addNewFile("participant",null,data.body.content[0].attachment.filename,data.body.content[0].attachment.fileSize);
                        //addNewFile("participant",data.body.content[0].attachment.url,data.body.content[0].attachment.filename,data.body.content[0].attachment.fileSize);
						//addNewMessage("participant", linkify(content.attachment.url), timeFormatter(data.body.channel.time));
                    }
                });
            }
        }
    }
}

function streamOnOpen(event){
    console.log("### WSS OPEN ###");
    createNewSession(false); // Wss bağlandığında bir session başlatıyoruz
}

function streamOnClose(event){
    console.log("### WSS CLOSE ###");
    console.log(event);
    
    console.log("Web socket connection lost, reconnecting.");
    $("#cx-messages *").remove(); // Remove all message items
    startConnection(wssUrl);
}

function streamOnError(event){
    console.log("### WSS ERROR ###");
    console.log(event);
}

function clearCookies() {
    //deleteCookie("cxLastMessageId");
    localStorage.removeItem("cxChatHistory2"); // LocalStorage dan chat geçmişini temizliyoruz.
}

function timeFormatter(time) {
    var _time = new Date(time);
    return (_time.getHours() > "9" ? _time.getHours() : "0" + _time.getHours()) + ":" + (_time.getMinutes() > "9" ? _time.getMinutes() : "0" + _time.getMinutes()); // + ":" + (_time.getSeconds() > "9" ? _time.getSeconds() : "0" + _time.getSeconds());
}

function messageSound(){
    var audio = new Audio('./sounds/Crystal.mp3'); // Crystal_Drop.mp3
    audio.play();
}

function linkify(inputText) {
    if(!inputText) 
        return inputText;

    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=_|!:,.;]*[-A-Z0-9+&@#\/%=_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

document.getElementById("delete-icon").addEventListener("click", function(event) {
    // UI btnChatExit
    // Sohbet ekranında değilse modal çıkarmadan direk sonlandırıyoruz.
    var cxMessageArea = document.getElementById("cx-message-area");
    if(!cxMessageArea || cxMessageArea.style.display == 'none') {
        uiWidgetRemove();
        clearCookies();
    }
    else {
        $(".cx-modals").removeClass("cx-hidden");
        $(".cx-modal-exit").removeClass("cx-hidden");
    }
    /*document.querySelector(".cx-modals").classList.remove("cx-hidden");
    document.querySelector(".cx-modal").classList.remove("cx-hidden");*/
}); 

document.getElementById("arrow-icon").addEventListener("click", function(event) {
    minimizeChat();
}); 

/*function getTokenFromUUID(uuid){
    // API URL
    const apiUrl = "BackgroundService/api/Token/generate";

    // AJAX POST Request
    $.ajax({
      url: apiUrl,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(uuid),
      success: function (response) {
        token = response.token;
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
}*/

function disconnectedConversation(forConId){
    // API URL
    const apiUrl = "BackgroundService/api/Conversation/disconnect";

    // AJAX POST Request
    $.ajax({
      url: apiUrl,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(forConId), // Send forConId as JSON
      success: function (response) {
        // Show success message
        $("#responseMessage").text(response);
        console.log("Success:", response);
      },
      error: function (xhr, status, error) {
        // Show error message
        const errorMessage = xhr.responseText || "An error occurred";
        $("#responseMessage").text("Error: " + errorMessage);
        console.error("Error:", error);
      },
    });
}

// Checking the web socket connection when the page is visible
document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
        if (webSocket.readyState !== WebSocket.OPEN) {
            console.log("Web socket connection lost, reconnecting.");
            $("#cx-messages *").remove(); // Remove all message items
            startConnection(wssUrl);
        }
    }
});