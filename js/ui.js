/* UI.js */
var cxMessages = $("#cx-messages");
var cxMessagesClass = $(".cx-messages")[0];
var fileFullName;
var fileFullSize;
// Scroll en alta indirmek için kullanıyoruz.
function scroolToBottom() {
    cxMessagesClass.scrollTo(0, cxMessagesClass.scrollHeight);
}

// Youtube linkini embed link olarak değiştirir
function convertYouTubeToEmbed(messageText) {
    if (!messageText) return messageText;

    // YouTube tüm URL formatlarını yakala
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?[^ ]*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;

    const match = messageText.match(youtubeRegex);

    // Link yoksa mesajı aynen döndür
    if (!match) return messageText;

    const videoId = match[1];
    const iframe = `
        <iframe 
            width="100%" 
            height="315" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // Eğer mesaj sadece linkten ibaretse direkt iframe döndür
    if (messageText.trim() === match[0].trim()) {
        return iframe.trim();
    }

    // Mesaj içinde link geçiyorsa linki iframe ile değiştir
    return messageText.replace(youtubeRegex, iframe.trim());
}

// Her yeni mesajda ekrana mesajı basıp, localStorage da aynı mesajı saklıyoruz.
function addNewMessage(messageType, messageText, messageTime) {
    var textAlignStyle = messageType === "system" ? "text-align: center;" : "";
    messageText = convertYouTubeToEmbed(messageText);

    // DOMPurify, HTML içeriğini güvenli hale getirir.
    var cleanMessageText = DOMPurify.sanitize(messageText);
    cleanMessageText = sanitizeInput(cleanMessageText);

    // Eğer boş bir mesaj gelirse ekrana yansıtma!
    if($.trim(cleanMessageText).length === 0) {
        console.log("addNewMessage: messageText is empty");
        return;
    }
	
    // HTML yapısını oluşturuyoruz
    var newMessageHTML = '<div class="cx-message cx-message-' + messageType + '"> \
        <div class="cx-message-icon">\
            <div class="icon-image"></div>\
            <div class="icon-text">Glamira</div>\
        </div> \
        <div class="cx-message-body"> \
            <div class="cx-message-text rtl-text" style="' + textAlignStyle + '">' + cleanMessageText + '</div> \
            <div class="cx-message-time">' + messageTime + '</div> \
        </div> \
    </div>';

    cxMessages.append(newMessageHTML);
    scroolToBottom();

    // LocalStorage da chat geçmişini tutuyoruz.
    var cxChatHistory = localStorage.getItem("cxChatHistory2");
    localStorage.setItem("cxChatHistory2", (cxChatHistory??"") + newMessageHTML);
}

// Enter ile chat başlatabilmeyi sağlıyoruz.
$('#txtStartMessage').keypress(function (e) {
    if (e.which == 13) {
        $("#btnSubmitForm").click();
    }
});

// Enter ile mesaj gönderebilmeyi sağlıyoruz.
$('#txtMessage').keypress(function (e) {
    if (e.which == 13) {
        var textMessage = $("#txtMessage").val();
        sendMessage(textMessage);
        $("#txtMessage").val("");
        return false;
    }
    else {
        sendTyping();
    }
});

var startMessageInterval; 
// Start new chat butonuna basınca chat başlamasını sağlıyoruz.
$("#btnSubmitForm").click(function(){
    var userData = {"displayName": null, "firstName": "ndgd", "lastName": null, "email": null, "phoneNumber": null, "avatarImageUrl": null, "customFields": null};
    
    userData.displayName = $("#txtEmail").val();
    userData.firstName = "Na";//$("#txtUserName").val();
    userData.email = $("#txtEmail").val();
    userData.customFields = {
        "Zendesk Email": $("#txtEmail").val()
    };

    var validation = true;

    if (userData.displayName == null || userData.displayName.length < 1) {
        validation = false;
        $("#userNameValidation").show();
    } else {
        $("#userNameValidation").hide();
    }

    if (userData.email == null || userData.email < 1) {
        validation = false;
        $("#emailValidation").show();
    } else {
        $("#emailValidation").hide();
    }

    if (validation == false) {
        return null;
    }

    // Kullanıcının formda yazdığı mesajı alıyoruz. UserDataCheck sonrası bu mesaja erişilemediği için burada alınmıştır.
    var _startMessage = $("#txtStartMessage").val();
    
    // Kullanıcı bilgileri kontrol ediliyor.
    var userDataStr = JSON.stringify(userData);
    var userDataBase64 = Base64.encode(userDataStr);
    pUserData = userDataBase64;
    UserDataCheck(_startMessage);
    
    // Kullanıcı mesajı gönderiliyor.
    /*if (_startMessage && _startMessage.length > 0) {
        startMessageInterval = setInterval(() => {
            sendMessage(_startMessage);
            clearInterval(startMessageInterval);
        }, 500);
    }*/

});

// Attach butonuna basınca dosya yükleme ve göndermeyi sağlıyoruz.
$("#btnAttach").click(function(){
	$('#fileUpload').trigger("click");
	//checkMediaPermissions();
});


$("#fileUpload").change(function(){
    const file = this.files[0]; 
    const fileName = file.name; 
    const fileType = file.type;
    const fileSize = (file.size / 1024).toFixed(2) + " KB";
    const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
	
    const uploadedFileCount = $(".cx-message-participant .file-message").length;
    if (uploadedFileCount >= 10) {
        var message = $.t("upload-status.max-file");
                    showMessage(
                        message, //"An error occurred while uploading the file, please try again.",
                        "red",
                        "block",
                        true,
                        3000,
                        "none"
                    );
        $("#fileUpload").val(null); // Hata durumunda input'u temizliyoruz
        return;
    }
	
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file && file.size > maxSize) {
        var message = $.t("upload-status.max-size");
                    showMessage(
                        message, //"An error occurred while uploading the file, please try again.",
                        "red",
                        "block",
                        true,
                        3000,
                        "none"
                    );
        $("#fileUpload").val(null); // Hata durumunda input'u temizliyoruz
        return;
    } 

    if (file && allowedFileTypes && blockedExtensions && ((!allowedFileTypes.map(x => x.type).includes('*/*') && !allowedFileTypes.map(x => x.type).includes(file.type)) || blockedExtensions.includes("." + fileExtension))){
        var message = $.t("upload-status.no-format");
                    showMessage(
                        message, //"An error occurred while uploading the file, please try again.",
                        "red",
                        "block",
                        true,
                        3000,
                        "none"
                    );
        $("#fileUpload").val(null); // Hata durumunda input'u temizliyoruz
        return;
    }

    //const isValidType = validFileTypes.some(fileTypeObj => fileTypeObj.type === fileType);
    //if(firstMessage!="" && firstMessage!=null && firstMessage!=undefined){
        sendPresigned(fileName,fileType,null, function(attachmentData) {
            uploadFile(attachmentData, file); 
            fileFullName = fileName;
            fileFullSize = fileSize;
         });
    /*}else {
        showMessage(
            "WebSocket Error: Please enter a message to start the chat before uploading your files.",
            "red",
            "block",
            true,
            5000,
            "none"
        );
    }*/
});
function uploadFile(attachmentData, file) {
    sendMessage("Forward me to agent.", true);

    const url = attachmentData.url;
    const headers = {
        "x-amz-tagging": attachmentData.xAmzTagging,
        "Content-Type": file.type // MIME türünü ekleyelim
    };

    // Dosyanın doğrudan blob olarak okunup gönderilmesi gerekiyor.
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    reader.onload = function(event) {
        const fileContent = event.target.result;

        // AJAX isteği gönder
        $.ajax({
            url: url,
            type: "PUT",
            headers: headers,
            data: fileContent, // FormData yerine doğrudan dosya içeriğini gönderiyoruz
            processData: false, // Veri işlenmeyecek
            contentType: file.type, // Doğru içerik türünü belirle
            success: function(response, textStatus, xhr) {
                if(xhr.status==200){
                    setTimeout(() => {
                        sendFinish(attachmentData.attachmentId);
                    }, 2000);
                    
                }else {
                    var message = $.t("upload-status.error");
                    showMessage(
                        message, //"An error occurred while uploading the file, please try again.",
                        "green",
                        "block",
                        true,
                        3000,
                        "none"
                    );
                }
            },
            error: function(xhr, status, error) {
                console.error("Dosya yüklenirken hata oluştu:", error);
                console.error("Hata Detayı: ", xhr.responseText);
            }
        });
    };

    reader.onerror = function() {
        console.error("Dosya okunurken hata oluştu.");
    };
}

// Gönder butonuna basınca mesaj göndermeyi sağlıyoruz.
$("#btnSendMessage").click(function(){
    var textMessage = $("#txtMessage").val();
    sendMessage(textMessage);
    $("#txtMessage").val("");
});

// Sohbeti küçült butonuna tıklayınca widget küçültmeyi sağlıyoruz.
$("#btnChatMinimize").click(function(){
    //window.parent.widgetClose();
    window.parent.postMessage("widgetClose", pBaseUrl);
});

// Sohbeti sonlandır butonuna tıklayınca modal çıkarıyoruz.
$("#btnChatExit").click(function(){
    // Sohbet ekranında değilse modal çıkarmadan direk sonlandırıyoruz.
    var cxMessageArea = document.getElementById("cx-message-area");
    if(!cxMessageArea || cxMessageArea.style.display == 'none') {
        uiWidgetRemove();
    }
    else {
        $(".cx-modals").removeClass("cx-hidden");
        $(".cx-modal-exit").removeClass("cx-hidden");
    }
});

// Sohbeti sonlandırma modalında sonlandır seçeneği seçildiğinde işlem yapıyoruz. 
$("#btnChatExitYes").click(function(){
    if(forConId == null) {
        uiWidgetRemove();
    }
    else {
        $("#btnChatExitNo").click();
        uiRedirectToSurvey();
        exitCurrentChat(); // Burası uiRedirect den aşağıda olmazsa chatId alınamaz!
    }
});

// Sohbeti sonlandır modalında vazgeç seçildiğinde modalı kapatıyoruz.
$("#btnChatExitNo").click(function(){
    $(".cx-modals").addClass("cx-hidden");
    $(".cx-modal-exit").addClass("cx-hidden");
});

function uiRedirectToSurvey(){   
    //var _conversationId = getCookie("cxConversationId");
    //setCookie("cxSurveyChatId", _conversationId, 5); 
    setCookie("cxSurveyChatId", forConId, 5); 
    $("#btnChatExitNo").click();
    $("#cx-message-area").remove();
    $("#surveyForm").show();
}

// Mesaj alanını disable yapmak için kullanılır.
function uiDisableMessageArea() {
    // Tıklamayı engelle
    $('.cx-message-footer *').css('pointer-events', 'none');    
    // Arka planı koyulaştır
    $('.cx-message-footer *').css('background-color', '#f7f7f7');     
    // Mouse görünümünü tdeğiştir
    $('.cx-message-footer').css('cursor', 'not-allowed');   
    // Tab yapılmasını engelle
    $('.cx-message-footer *').attr('tabindex', '-1');
}

function uiWidgetRemove(){
    //clearCookies();
    //deleteCookie("cxSurveyChatId");
    setTimeout(() => {
        window.parent.postMessage("widgetRemove", pBaseUrl);
        closeSupportChat();
        clearCookies();
        //exitCurrentChat();
    }, 300);
}

// Privacy policy hide 
function PrivacyPolicyHide() {
    var _privacyPolicyElem = $(".cx-privacy-policy");
    _privacyPolicyElem.hide();
}

// User data check 

function UserDataCheck(message) {  
    if (checkCookie("cxEventStreamUri") || 
        (pUserData != null && pUserData.length > 0)) {
        $("#userForm").remove();   
        $("#cx-message-area").show();   
        setTimeout(() => {
            sendMessage(message);

            // Privacy policy hide after 60 seconds 
            setTimeout(() => {
                PrivacyPolicyHide();
            }, 60000);
        }, 500);     
    }  
    else if (checkCookie("cxSurveyChatId")) {
        //$("#userForm").remove();   
        //$("#cx-message-area").remove();  
        //$("#surveyForm").show();
    }
    else {
        //$("#userForm").show();
        //$("#cx-message-area").hide();
    }
} 

// Anket cevabını gönderiyoruz ve feedback alanımızı gösteriyoruz.
$("#btnSendForm").click(function(){
    var _rate = $('input[name="chkRate"]:checked').val();
    var _message = $("#txtSurveyMessage").val();

    // DOMPurify, HTML içeriğini güvenli hale getirir.
    var _sMessage = DOMPurify.sanitize(_message);
    _sMessage = sanitizeInput(_sMessage);

    if (checkCookie("cxSurveyChatId")) {        
        var _chatId = getCookie("cxSurveyChatId");

        var answers = {
            "chatId": _chatId,
            "rate": _rate,
            "comment": _sMessage
        };

        $.ajax({
            type: "POST",
            headers: { 
                'Content-Type': 'application/json',
                "Api-Credential": "c8764636f4d848f99c6df334cf2be51b"
            },
            data: JSON.stringify(answers),
            url: "/survey/api/survey/send",
            success: function(data, textStatus, request) {
                console.log("Survey send message: ");
                console.log(data);

                if(data.status == "Sended") {
                    console.log("Sended survey answers");
                }
                else {
                    console.log("Error: An error occurred while saving the survey");
                }
                
                $("#surveyForm").remove();
                $("#surveyFeedback").show();
            },
            error: function(data, textStatus, error) {
                console.log("Seurvey send error: ");
                console.log(data);

                $("#surveyForm").remove();
                $("#surveyFeedback").show();
            }
        });
    }
    else {
        console.log("Error: Not found conversation id!");
    }
});

// Anket geri bildirimi alanını kapatıyoruz.
$("#btnSurveyFeedbackClose").click(function(){
    uiWidgetRemove();
});

// Sayfa yüklenince dil set ediliyor ve kullanıcı bilgisi kontrol ediliyor.
/*$(function () {
    // Localization 
    i18next
    .use(i18nextXHRBackend)
    .init({
        debug: false,
        lng: pLanguage,
        backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json'
        }       
    }, function(err, t) {
        i18nextJquery.init(i18next, $);
        $('body').localize();

        $('.lang-select').click(function() {
        i18next.changeLanguage(this.innerHTML);
        $('body').localize();
        });
    });

    // User data check
    UserDataCheck();
});*/

function setLocalization(_lng) {
    // Localization 
    i18next
    .use(i18nextXHRBackend)
    .init({
        debug: false,
        lng: _lng,
        backend: {
        loadPath: './locales/{{lng}}/{{ns}}.json'
        }       
    }, function(err, t) {
        i18nextJquery.init(i18next, $);
        $('body').localize();

        $('.lang-select').click(function() {
        i18next.changeLanguage(this.innerHTML);
        $('body').localize();
        });
    });
}

function adjustHeight(textarea) {
    // Başlangıç yüksekliğini sıfırlıyoruz
    textarea.style.height = 'auto';
    // Yüksekliği metnin yüksekliğine göre ayarlıyoruz
    textarea.style.height = (textarea.scrollHeight) + 'px';

    // 3 satırdan fazla yazıldığında scroll aktif olacak şekilde
    if (textarea.scrollHeight > 72) {
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}


function showMessage(message, color, displayType, hasSetTimeOut,timeout, setTimeOutDisplay) {
    const messageElement = document.getElementById("fileMessage");

    if (messageElement) {
        messageElement.textContent = message;       // Mesajı güncelle
        messageElement.style.color = color;         // Renk ayarı
        messageElement.style.display = displayType;     // Görünür yap

        if(hasSetTimeOut){
            setTimeout(() => {
                messageElement.style.display = setTimeOutDisplay;  // Belirtilen süre sonunda gizle
            }, timeout);
        }
    
    }
}


function addNewFile(messageType, downloadUrl, fileName, fileSize) {
    fileName = shortenFileName(fileName,15)
    if(messageType =="agent")
        fileSize =(fileSize / 1024).toFixed(2) + " KB";
    
    // DOMPurify, HTML içeriğini güvenli hale getirir.
    var cleanFileName = DOMPurify.sanitize(fileName);
    cleanFileName = sanitizeInput(cleanFileName);
	
    if(downloadUrl) {
        var newMessageHTML = `
            <div class="cx-message cx-message-${messageType}">
                <div class="cx-message-body file-message">
                    <div class="file-icon-wrapper">
                        <img src="img/folder.svg" class="file-icon" alt="File Icon">
                    </div>
                    <div class="file-info">
                        <span class="file-name">${cleanFileName}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <img src="img/downloadIcon.svg" class="download-icon" alt="Download Icon" onclick="downloadFile('${downloadUrl}', '${cleanFileName}')">
                </div>
            </div>
        `;
    }
    else {
        var newMessageHTML = `
            <div class="cx-message cx-message-${messageType}">
                <div class="cx-message-body file-message">
                    <div class="file-icon-wrapper">
                        <img src="img/folder.svg" class="file-icon" alt="File Icon">
                    </div>
                    <div class="file-info">
                        <span class="file-name">${cleanFileName}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                </div>
            </div>
        `;
    }

    cxMessages.append(newMessageHTML);
    scroolToBottom();

    // LocalStorage da chat geçmişini tutuyoruz.
    var cxChatHistory = localStorage.getItem("cxChatHistory2") || "";
    localStorage.setItem("cxChatHistory2", (cxChatHistory??"") + newMessageHTML);
}

async function downloadFile(downloadUrl, fileName) {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Dosya indirilemedi!");

        const blob = await response.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName; // Dosya adı
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (error) {
        console.error("İndirme hatası:", error);
    }
}


function shortenFileName(fileName, maxLength = 15) {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return fileName.length > maxLength ? fileName.substring(0, maxLength) : fileName;

    const namePart = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);

    return namePart.length > maxLength ? namePart.substring(0, maxLength) + extension : fileName;
}

// Check network connection
function checkNetworkConnection() {
    if ($("#mainContainer").length > 0 && !navigator.onLine) {
        $("#mainContainer").addClass("cx-hidden");
        $(".cx-modals").removeClass("cx-hidden");
        $(".cx-modal-networkerror").removeClass("cx-hidden");
    } 
}

setInterval(checkNetworkConnection, 3000);

// Check camera and microphone permissions
function checkMediaPermissions() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                console.log("Permission granted.");
                //console.log("İzin verildi ve medya akışı başarıyla başlatıldı.");
            })
            .catch(function(error) {
                if (error.name === "NotAllowedError") {
                    //console.log("Kullanıcı izin vermedi.");
                    console.log("User did not allowed!");
                } else if (error.name === "NotFoundError") {
                    //console.log("Kamera veya mikrofon bulunamadı.");
                    console.log("No camera or microphone found!");
                } else {
                    //console.log("Başka bir hata oluştu: " + error.message);
                    console.log("Media access error: ", error);
                }
            });
    } else {
        //console.log("Bu tarayıcı getUserMedia API'sini desteklemiyor.");
        console.log("getUserMedia is not supported on this browser.");
    }
}

function sanitizeInput(input) {
    var doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.body.textContent || "";
}

function newMessage(message, sender = "agent") {
    try {
        Android.newMessage(message, sender); // Android uygulamalarına newMessage ve message bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
    
    try {
        window.webkit.messageHandlers.iosHandler.postMessage({method:
            "newMessage", message: message, sender: sender}); // IOS uygulamalarına newMessage ve message bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
}

function minimizeChat() {
    try {
        Android.minimizeChat(); // Android uygulamalarına minimize edilmesi gerektiği bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
    
    try {
        window.webkit.messageHandlers.iosHandler.postMessage({method: "minimizeChat"}); // IOS uygulamalarına minimize edilmesi gerektiği bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
}

function closeSupportChat() {
    try {
        Android.closeChat(); // Android uygulamalarına close edilmesi gerektiği bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
    
    try {
        window.webkit.messageHandlers.iosHandler.postMessage({method: "closeChat"}); // IOS uygulamalarına close edilmesi gerektiği bilgisini gönder.
    } catch (error) {
        console.log(error)
    }
}

function splitText(text, chunkSize = 4000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

/* SuperQi IOS Requirement */
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function compareVersion(v1, v2) {
    var arr1 = v1.split('.');
    var arr2 = v2.split('.');
    var minLength = Math.min(arr1.length, arr2.length);
    var position = 0;
    var diff = 0;
    while (position < minLength) {
        diff = parseInt(arr1[position], 10) - parseInt(arr2[position], 10);
        if (diff !== 0) {
            break;
        }
        position++;
    }
    diff = diff !== 0 ? diff : arr1.length - arr2.length;
    return diff;
}

const msgInput = document.getElementById('txtMessage')
msgInput.addEventListener('focus', () => {
   const version = parameters['appVersion'];
   if (isIOS() && compareVersion(version, '1.0.33') >= 0) {
       const mainContainer = document.getElementById('mainContainer')
       const messagesContainer = document.getElementById('cx-messages')
       if (visualViewport && messagesContainer && mainContainer) {
           setTimeout(() => {
           const keyboardHeight = document.documentElement.clientHeight - visualViewport.height
           mainContainer.style.height = `calc(100% - ${keyboardHeight}px)`
           messagesContainer.scrollTo({top: messagesContainer.scrollHeight, behavior: 'smooth'})
       }, 600)
       }
   }
})
 
msgInput.addEventListener('blur', () => {
    const version = parameters['appVersion'];
    if (isIOS() && compareVersion(version, '1.0.33') >= 0) {
        // only ios should to resize the main container
        setTimeout(() => {
            const mainContainer = document.getElementById('mainContainer')
            mainContainer.style.height = `100%`
        }, 200)
    }
})