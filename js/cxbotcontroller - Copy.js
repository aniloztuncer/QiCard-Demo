async function checkBotActivate() {
    const url = "https://pc.wace.com.tr/V2/Services/api/Chatbot";
    const params = {
        userName: "qiApi",
        password: "Qi412*fa23!"
    };

    try {
        // URL'ye GET isteği at
        const response = await fetch(`${url}?userName=${encodeURIComponent(params.userName)}&password=${encodeURIComponent(params.password)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // pcName 'QiCard' olan nesneyi bul
        const targetItem = data.find(item => item.pcName === "QiCard");

        if (targetItem) {
            return targetItem.cbStatus; // cbStatus değerini döndür
        } else {
            throw new Error("pcName 'QiCard' bulunamadı.");
        }
    } catch (error) {
        console.error("Hata oluştu:", error.message);
        return null; // Hata durumunda null döndür
    }
}

async function getTokenForBot() {
    /*const isBotActive = await checkBotActivate();
    if (!isBotActive) {
        console.error("Bot aktif değil.");
        return null; // Bot aktif değilse null döndür
    }*/

    const url = "https://qibot-api-prod.ai-ceo.ai/auth/token";
    const formData = new URLSearchParams();
    formData.append("username", "cxteam");
    formData.append("password", "o3ynJpuaJx3FTPM");

    try {
        // URL'ye POST isteği at
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.access_token) {
            return data.access_token; // access_token değerini döndür
        } else {
            throw new Error("access_token bulunamadı.");
        }
    } catch (error) {
        console.error("Hata oluştu:", error.message);
        return null; // Hata durumunda null döndür
    }
}

let cachedToken = null; // Token'ı saklamak için global değişken
//https://qibot-api-uat.ai-ceo.ai/api/v2/chatbot/chat
//https://qibot-api-intdev.ai-ceo.ai/api/v2/chatbot/chat
async function sendBotMessage(displayName, email, firstName, lastName, question) {
    const url = "https://qibot-api-prod.ai-ceo.ai/api/v2/chatbot/chat";

    // Gönderilecek JSON body
    const body = {
        "payload": {
            "display_name": displayName,
            "email": email + "@qi.iq",
            "first_name": firstName,
            "last_name": lastName,
            "question": question,
            "custom_fields": {
                //"avatar_image_url": "http://example.com/avatar.jpg",
                "channel": "mobileapp"
            }
        }
    };

    try {
        // Eğer token yoksa veya geçersizse yeni bir token al
        if (!cachedToken) {
            cachedToken = await getTokenForBot();
            if (!cachedToken) {
                throw new Error("Token alınamadı.");
            }
        }

        // URL'ye POST isteği at
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cachedToken}`
            },
            body: JSON.stringify(body)
        });

        // Eğer token geçersizse yeni bir token al ve tekrar dene
        if (response.status === 401) { // 401 Unauthorized
            console.warn("Token geçersiz, yeni bir token alınıyor...");
            cachedToken = await getTokenForBot();
            if (!cachedToken) {
                throw new Error("Yeni token alınamadı.");
            }

            // Tekrar POST isteği at
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cachedToken}`
                },
                body: JSON.stringify(body)
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Yanıtı döndür
    } catch (error) {
        console.error("Hata oluştu:", error.message);
        return null; // Hata durumunda null döndür
    }
}